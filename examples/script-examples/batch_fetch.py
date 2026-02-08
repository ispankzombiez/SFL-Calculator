#!/usr/bin/env python3
"""
Batch Farm Data Fetcher
Reads a list of farm IDs and fetches data for all of them in batch,
saving each response with the username as filename in a timestamped folder.
"""

import requests
import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
import time


def load_farm_ids(file_path: str = "farm_ids.txt") -> tuple[List[str], float]:
    """
    Load farm IDs from a text file, skipping the first line which contains wait time.
    
    Args:
        file_path: Path to the farm IDs file
        
    Returns:
        Tuple of (farm_ids_list, wait_time_seconds)
    """
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(script_dir)  # Go up one level to main directory
        full_path = os.path.join(parent_dir, file_path)
        
        with open(full_path, 'r') as f:
            lines = [line.strip() for line in f if line.strip()]
        
        # First line contains wait time setting
        if lines and lines[0].startswith('WAIT_TIME_SECONDS='):
            wait_time = float(lines[0].split('=')[1])
            farm_ids = lines[1:]
        else:
            wait_time = 31.0  # Default fallback
            farm_ids = lines
        
        print(f"📋 Loaded {len(farm_ids)} farm IDs from {file_path}", flush=True)
        print(f"⏰ Current adaptive wait time: {wait_time}s", flush=True)
        return farm_ids, wait_time
    except FileNotFoundError:
        print(f"❌ Farm IDs file not found: {file_path}")
        return [], 31.0
    except Exception as e:
        print(f"❌ Error reading farm IDs file: {e}")
        return [], 31.0


def update_wait_time(new_wait_time: float, file_path: str = "farm_ids.txt"):
    """
    Update the wait time in farm_ids.txt based on learned API behavior.
    """
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(script_dir)
        full_path = os.path.join(parent_dir, file_path)
        
        with open(full_path, 'r') as f:
            lines = f.read().strip().split('\n')
        
        # Update first line with new wait time
        lines[0] = f"WAIT_TIME_SECONDS={new_wait_time:.1f}"
        
        with open(full_path, 'w') as f:
            f.write('\n'.join(lines))
        
        print(f"📝 Updated adaptive wait time to {new_wait_time:.1f}s")
    except Exception as e:
        print(f"❌ Error updating wait time: {e}")


def fetch_api_data(url: str, api_key: str, timeout: int = 10, max_retries: int = 3, retry_delay: float = 10.0) -> Optional[str]:
    """
    Fetch data from API with x-api-key authentication and retry logic.
    
    Args:
        url: The API endpoint URL
        api_key: The API key for authentication
        timeout: Request timeout in seconds (default: 10)
        max_retries: Maximum number of retry attempts (default: 3)
        retry_delay: Delay between retries in seconds (default: 10.0)
        
    Returns:
        Response data as string, or None if failed after all retries
    """
    headers = {
        'x-api-key': api_key,
        'Accept': 'application/json',
        'User-Agent': 'Python-API-Fetcher/1.0'
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.get(
                url, 
                headers=headers, 
                timeout=timeout
            )
            
            if response.status_code == 200:
                return response.text
            else:
                print(f"❌ API response code: {response.status_code} for {url} (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"⏳ Waiting {retry_delay}s before retry...")
                    time.sleep(retry_delay)
                    continue
                return None
                
        except requests.exceptions.Timeout:
            print(f"❌ Request timed out for {url} (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                print(f"⏳ Waiting {retry_delay}s before retry...")
                time.sleep(retry_delay)
            else:
                print(f"❌ Failed after {max_retries} timeout attempts")
                return None
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection error for {url} (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                print(f"⏳ Waiting {retry_delay}s before retry...")
                time.sleep(retry_delay)
            else:
                print(f"❌ Failed after {max_retries} connection attempts")
                return None
        except requests.exceptions.RequestException as e:
            print(f"❌ API fetch error for {url} (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                print(f"⏳ Waiting {retry_delay}s before retry...")
                time.sleep(retry_delay)
            else:
                print(f"❌ Failed after {max_retries} request attempts")
                return None


def load_farm_id_mapping(mapping_file: str = "farm_id_mapping.json") -> Dict[str, str]:
    """
    Load existing short_id -> long_id mappings from file.
    
    Args:
        mapping_file: Path to the mapping file
        
    Returns:
        Dictionary mapping short_id -> long_id
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    mapping_path = os.path.join(parent_dir, mapping_file)
    
    if os.path.exists(mapping_path):
        try:
            with open(mapping_path, 'r', encoding='utf-8') as f:
                mapping = json.load(f)
            print(f"📋 Loaded {len(mapping)} existing farm ID mappings from {mapping_file}")
            return mapping
        except (json.JSONDecodeError, IOError) as e:
            print(f"⚠️ Error loading farm ID mapping: {e}")
            return {}
    else:
        print(f"📋 No existing farm ID mapping found, will create new one")
        return {}


def save_farm_id_mapping(mapping: Dict[str, str], mapping_file: str = "farm_id_mapping.json") -> bool:
    """
    Save short_id -> long_id mappings to file.
    
    Args:
        mapping: Dictionary mapping short_id -> long_id
        mapping_file: Path to the mapping file
        
    Returns:
        True if saved successfully
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    mapping_path = os.path.join(parent_dir, mapping_file)
    
    try:
        with open(mapping_path, 'w', encoding='utf-8') as f:
            json.dump(mapping, f, indent=2)
        print(f"💾 Saved {len(mapping)} farm ID mappings to {mapping_file}")
        return True
    except IOError as e:
        print(f"❌ Error saving farm ID mapping: {e}")
        return False


def build_mapping_from_raw_files(farm_ids: List[str], api_key: str, wait_time: float, mapping_file: str = "farm_id_mapping.json") -> Dict[str, str]:
    """
    Build farm ID mapping from existing raw pull files and fetch any missing farms individually.
    
    Args:
        farm_ids: List of short farm IDs we need
        api_key: API key for authentication  
        wait_time: Wait time between individual API calls for missing farms
        mapping_file: Path to the mapping cache file
        
    Returns:
        Dictionary mapping short_id -> long_id
    """
    print(f"🔍 Building farm ID mapping from existing files...")
    
    # Load any existing mapping
    short_to_long = load_farm_id_mapping(mapping_file)
    
    # Get the raw pull directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    raw_pull_dir = os.path.join(parent_dir, "raw pull")
    
    print(f"📄 Scanning ALL raw pull files to build mapping...")
    
    # First, scan ALL raw pull files to extract any existing mappings we don't have yet
    farms_mapped_from_files = 0
    if os.path.exists(raw_pull_dir):
        for filename in os.listdir(raw_pull_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(raw_pull_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                    # Extract mapping from this file
                    if 'nft_id' in data and 'id' in data:
                        file_short_id = str(data['nft_id'])
                        file_long_id = str(data['id'])
                        
                        # Only add if we don't already have this mapping
                        if file_short_id not in short_to_long or file_long_id not in short_to_long:
                            # Create bidirectional mapping
                            short_to_long[file_short_id] = file_long_id  # short -> long
                            short_to_long[file_long_id] = file_long_id   # long -> long
                            farms_mapped_from_files += 1
                            print(f"📄 Extracted mapping from {filename}: {file_short_id} -> {file_long_id}")
                            
                except (json.JSONDecodeError, IOError) as e:
                    print(f"⚠️ Error reading {filename}: {e}")
                    continue
    
    if farms_mapped_from_files > 0:
        print(f"📄 Extracted {farms_mapped_from_files} new mappings from existing raw files")
        # Save the updated mapping
        save_farm_id_mapping(short_to_long, mapping_file)
    
    # Now check which of our target farm IDs we still need to fetch
    farms_to_fetch = [farm_id for farm_id in farm_ids if farm_id not in short_to_long]
    
    if not farms_to_fetch:
        print(f"✅ All {len(farm_ids)} farms already mapped!")
        if farms_mapped_from_files > 0:
            save_farm_id_mapping(short_to_long, mapping_file)
        return {farm_id: short_to_long[farm_id] for farm_id in farm_ids if farm_id in short_to_long}
    
    print(f"🔄 Need to fetch {len(farms_to_fetch)} farms individually...")
    print(f"⏰ Using adaptive wait time: {wait_time}s between API calls")
    
    # Fetch missing farms individually
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }
    
    for i, short_id in enumerate(farms_to_fetch, 1):
        print(f"📊 Getting data for farm {short_id} ({i}/{len(farms_to_fetch)})")
        
        url = f"https://api.sunflower-land.com/community/farms/{short_id}"
        
        # Retry loop for rate limiting
        success = False
        max_retries = 10
        retry_count = 0
        
        while not success and retry_count < max_retries:
            try:
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    farm_data = response.json()
                    if 'id' in farm_data and 'nft_id' in farm_data:
                        long_id = str(farm_data['id'])
                        short_id_from_api = str(farm_data['nft_id'])
                        
                        # Create bidirectional mapping
                        short_to_long[short_id_from_api] = long_id  # short -> long  
                        short_to_long[long_id] = long_id            # long -> long
                        print(f"✅ {short_id_from_api} -> {long_id} (bidirectional)")
                        
                        # Save the raw data to raw pull folder
                        save_farm_data(json.dumps(farm_data), short_id_from_api, raw_pull_dir)
                        
                        # Save mapping progress immediately
                        save_farm_id_mapping(short_to_long, mapping_file)
                        print(f"💾 Progress saved ({len(short_to_long)} total mappings)")
                        
                        success = True
                    else:
                        print(f"❌ Missing id/nft_id fields for farm {short_id}")
                        success = True
                elif response.status_code == 429:
                    retry_count += 1
                    print(f"⏳ Rate limited for farm {short_id} (attempt {retry_count}/{max_retries}), waiting 10s...")
                    time.sleep(10)
                else:
                    print(f"❌ Failed to get data for farm {short_id}: {response.status_code}")
                    success = True
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Error getting data for farm {short_id}: {e}")
                success = True
        
        if not success:
            print(f"❌ Failed to get data for farm {short_id} after {max_retries} rate limit retries")
        
        # Wait between individual calls
        if i < len(farms_to_fetch):
            print(f"⏸️ Waiting {wait_time}s before next request...")
            time.sleep(wait_time)
    
    # Return mappings for requested farm IDs
    result = {farm_id: short_to_long[farm_id] for farm_id in farm_ids if farm_id in short_to_long}
    print(f"🎯 Successfully mapped {len(result)}/{len(farm_ids)} farms")
    return result


def get_long_farm_ids(farm_ids: List[str], api_key: str, wait_time: float, mapping_file: str = "farm_id_mapping.json") -> Dict[str, str]:
    """
    Convert short farm IDs to long farm IDs, using cache when possible.
    
    Args:
        farm_ids: List of short farm IDs
        api_key: API key for authentication
        wait_time: Wait time between API calls (from adaptive system)
        mapping_file: Path to the mapping cache file
    
    Returns:
        Dictionary mapping short_id -> long_id
    """
    print(f"🔍 Processing {len(farm_ids)} farm IDs (using cache when available)...")
    
    # Load existing mappings
    short_to_long = load_farm_id_mapping(mapping_file)
    
    # Find farms we still need to look up
    farms_to_lookup = [farm_id for farm_id in farm_ids if farm_id not in short_to_long]
    
    if not farms_to_lookup:
        print(f"✅ All farm IDs already cached! No API calls needed.")
        return {farm_id: short_to_long[farm_id] for farm_id in farm_ids if farm_id in short_to_long}
    
    print(f"🔍 Need to lookup {len(farms_to_lookup)} new farm IDs...")
    print(f"💚 Using cache for {len(farm_ids) - len(farms_to_lookup)} farm IDs")
    print(f"⏰ Using adaptive wait time: {wait_time}s between API calls")
    
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }
    
    new_mappings = {}
    
    for i, short_id in enumerate(farms_to_lookup, 1):
        print(f"📊 Getting long ID for farm {short_id} ({i}/{len(farms_to_lookup)})")
        
        url = f"https://api.sunflower-land.com/community/farms/{short_id}"
        
        # Retry loop for rate limiting
        success = False
        max_retries = 10  # Maximum number of retries for rate limiting
        retry_count = 0
        
        while not success and retry_count < max_retries:
            try:
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    farm_data = response.json()
                    if 'id' in farm_data:
                        long_id = str(farm_data['id'])
                        new_mappings[short_id] = long_id
                        short_to_long[short_id] = long_id
                        print(f"✅ {short_id} -> {long_id}")
                        
                        # Save progress immediately after each successful lookup
                        save_farm_id_mapping(short_to_long, mapping_file)
                        print(f"💾 Progress saved ({len(short_to_long)} total mappings)")
                        
                        success = True
                    else:
                        print(f"❌ No 'id' field found for farm {short_id}")
                        success = True  # Don't retry if there's no ID field
                elif response.status_code == 429:
                    retry_count += 1
                    print(f"⏳ Rate limited for farm {short_id} (attempt {retry_count}/{max_retries}), waiting 10s...")
                    time.sleep(10)
                    # Continue the while loop to retry the same farm
                else:
                    print(f"❌ Failed to get long ID for farm {short_id}: {response.status_code}")
                    success = True  # Don't retry for other error codes
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Error getting long ID for farm {short_id}: {e}")
                success = True  # Don't retry for connection errors
        
        if not success:
            print(f"❌ Failed to get long ID for farm {short_id} after {max_retries} rate limit retries")
        
        # Use the same adaptive wait time as the main script between individual calls
        if i < len(farms_to_lookup):  # Don't wait after the last request
            print(f"⏸️ Waiting {wait_time}s before next request...")
            time.sleep(wait_time)
    
    # Final summary (no need to save again since we saved after each lookup)
    if new_mappings:
        print(f"🎯 Added {len(new_mappings)} new farm ID mappings to cache")
    
    # Return mappings for requested farm IDs
    result = {farm_id: short_to_long[farm_id] for farm_id in farm_ids if farm_id in short_to_long}
    print(f"🎯 Successfully have {len(result)}/{len(farm_ids)} farm ID mappings")
    return result


def fetch_farms_batch(long_farm_ids: List[str], api_key: str, chunk_size: int = 50) -> Dict[str, Any]:
    """
    Fetch multiple farms at once using the batch POST /community/getFarms endpoint with long IDs.
    
    Args:
        long_farm_ids: List of long farm IDs to fetch
        api_key: API key for authentication
        chunk_size: Maximum number of farms to request in each batch
    
    Returns:
        Dictionary with farm data keyed by long farm ID
    """
    url = "https://api.sunflower-land.com/community/getFarms"
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }
    
    all_farm_data = {}
    
    # Split long_farm_ids into chunks to avoid overwhelming the API
    for i in range(0, len(long_farm_ids), chunk_size):
        chunk = long_farm_ids[i:i + chunk_size]
        print(f"📦 Fetching batch {i//chunk_size + 1}: {len(chunk)} farms")
        
        # Use the correct format: array of string IDs, not integers
        payload = {
            "ids": chunk  # Keep as strings, don't convert to integers
        }
        
        print(f"🚀 Sending batch request with {len(chunk)} long farm IDs")
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                batch_data = response.json()
                print(f"✅ Response type: {type(batch_data)}, length: {len(batch_data) if isinstance(batch_data, (list, dict)) else 'N/A'}")
                
                # Handle different response formats
                if isinstance(batch_data, dict):
                    # If response is a dict, use as is
                    all_farm_data.update(batch_data)
                    print(f"✅ Successfully fetched {len(batch_data)} farms in this batch (dict format)")
                    
                elif isinstance(batch_data, list):
                    # If response is a list, convert to dict keyed by farm ID
                    for farm_data in batch_data:
                        if isinstance(farm_data, dict) and 'id' in farm_data:
                            long_id = str(farm_data['id'])
                            all_farm_data[long_id] = farm_data
                    print(f"✅ Successfully fetched {len(batch_data)} farms in this batch (list format)")
                    
                else:
                    print(f"⚠️ Unexpected response format: {type(batch_data)}")
                    print(f"Sample response: {str(batch_data)[:200]}")
                    
            elif response.status_code == 429:
                print(f"⏳ Rate limited on batch {i//chunk_size + 1}, waiting 30s...")
                time.sleep(30)
                # Retry this chunk
                i -= chunk_size
                continue
                
            else:
                print(f"❌ Batch request failed with status {response.status_code}")
                print(f"Response: {response.text[:300]}")
                
        except requests.exceptions.Timeout:
            print(f"❌ Batch request timed out for chunk {i//chunk_size + 1}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Batch request error for chunk {i//chunk_size + 1}: {e}")
            
        # Small delay between batches to be respectful
        time.sleep(2)
    
    print(f"🎯 Total farms fetched: {len(all_farm_data)}")
    return all_farm_data


def create_raw_pull_folder() -> str:
    """
    Create/clear the raw pull folder for this batch.
    
    Returns:
        Path to the raw pull folder
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)  # Go up one level to main directory
    folder_name = "raw pull"
    folder_path = os.path.join(parent_dir, folder_name)
    
    try:
        # Create folder if it doesn't exist
        os.makedirs(folder_path, exist_ok=True)
        
        # Clear existing files in the folder
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        
        print(f"📁 Prepared raw pull folder: {folder_name}")
        return folder_path
    except Exception as e:
        print(f"❌ Error preparing raw pull folder: {e}")
        return os.path.dirname(script_dir)  # Return main directory as fallback


def save_farm_data(data: str, farm_id: str, folder_path: str) -> bool:
    """
    Save the fetched farm data using the username as filename.
    
    Args:
        data: The JSON data to save
        farm_id: The farm ID (used as fallback)
        folder_path: The folder to save the file in
        
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        # Extract username from the JSON data
        json_data = json.loads(data)
        farm_data = json_data.get('farm', {})
        raw_username = farm_data.get('username')
        
        if raw_username:
            username = raw_username.lower()  # Convert to lowercase
            filename = f"{username}.json"
        else:
            filename = f"farm_{farm_id}.json"
            print(f"⚠️  No username found for farm {farm_id}, using fallback filename")
        
        file_path = os.path.join(folder_path, filename)
        
        # Save as pretty-printed JSON
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        
        if raw_username:
            print(f"✅ Saved {raw_username} -> {filename}", flush=True)
        else:
            print(f"✅ Saved farm_{farm_id} -> {filename}", flush=True)
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON for farm {farm_id}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error saving farm {farm_id}: {e}")
        return False


def process_batch(farm_ids: List[str], api_key: str, delay: float = 31.0) -> None:
    """
    Process a batch of farm IDs.
    
    Args:
        farm_ids: List of farm IDs to process
        api_key: API key for authentication
        delay: Delay between requests in seconds (default: 31.0)
    """
    if not farm_ids:
        print("❌ No farm IDs to process")
        return
    
    # Create/clear raw pull folder
    raw_pull_folder = create_raw_pull_folder()
    
    successful = 0
    failed = 0
    
    print(f"🚀 Starting batch processing of {len(farm_ids)} farms...")
    print(f"⏱️ Using {delay}s delay between requests to respect rate limits")
    
    for i, farm_id in enumerate(farm_ids, 1):
        print(f"\n📊 Processing {i}/{len(farm_ids)}: Farm {farm_id}")
        
        # Build API URL
        url = f"https://api.sunflower-land.com/community/farms/{farm_id}"
        
        # Fetch data
        data = fetch_api_data(url, api_key)
        
        if data:
            # Save data
            if save_farm_data(data, farm_id, raw_pull_folder):
                successful += 1
            else:
                failed += 1
        else:
            failed += 1
            print(f"❌ Failed to fetch data for farm {farm_id}")
        
        # Add delay between requests to be respectful to the API
        if i < len(farm_ids):  # Don't delay after the last request
            print(f"⏸️ Waiting {delay}s before next request...")
            time.sleep(delay)
    
    print(f"\n📈 Batch processing complete!")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📁 Results saved in: raw pull")


def process_batch_adaptive(farm_ids: List[str], api_key: str, initial_wait_time: float, file_path: str) -> None:
    """
    Process a batch of farm IDs with adaptive rate limiting.
    
    Args:
        farm_ids: List of farm IDs to process
        api_key: API key for authentication
        initial_wait_time: Initial wait time between requests
        file_path: Path to farm_ids.txt for updating wait time
    """
    if not farm_ids:
        print("❌ No farm IDs to process")
        return
    
    # Create/clear raw pull folder
    raw_pull_folder = create_raw_pull_folder()
    
    successful = 0
    failed = 0
    total_wait_times = []
    current_wait_time = initial_wait_time
    
    print(f"🚀 Starting adaptive batch processing of {len(farm_ids)} farms...")
    print(f"⏱️ Initial adaptive delay: {current_wait_time}s between requests")
    
    for i, farm_id in enumerate(farm_ids, 1):
        print(f"\n📊 Processing {i}/{len(farm_ids)}: Farm {farm_id}", flush=True)
        
        # Record start time for adaptive timing
        request_start_time = time.time()
        
        # Build API URL
        url = f"https://api.sunflower-land.com/community/farms/{farm_id}"
        
        # Fetch data
        data = fetch_api_data(url, api_key)
        
        # Record end time
        request_end_time = time.time()
        actual_request_time = request_end_time - request_start_time
        
        if data:
            # Save data
            if save_farm_data(data, farm_id, raw_pull_folder):
                successful += 1
            else:
                failed += 1
        else:
            failed += 1
            print(f"❌ Failed to fetch data for farm {farm_id}")
        
        # Adaptive wait time logic
        if i < len(farm_ids):  # Don't wait after last request
            # Analyze response time and adjust wait time
            if actual_request_time > current_wait_time:
                # API took longer than expected, increase wait time
                new_wait_time = min(actual_request_time * 1.2, 60.0)  # Cap at 60s
                if new_wait_time > current_wait_time + 2:
                    print(f"📈 API response slower than expected ({actual_request_time:.1f}s), increasing wait time to {new_wait_time:.1f}s")
                    current_wait_time = new_wait_time
                    update_wait_time(current_wait_time, file_path)
            elif actual_request_time < current_wait_time * 0.5 and len(total_wait_times) >= 3:
                # API consistently faster, try reducing wait time
                avg_recent_time = sum(total_wait_times[-3:]) / 3
                if avg_recent_time < current_wait_time * 0.6:
                    new_wait_time = max(avg_recent_time * 1.5, 15.0)  # Minimum 15s
                    if new_wait_time < current_wait_time - 2:
                        print(f"📉 API consistently fast ({avg_recent_time:.1f}s avg), reducing wait time to {new_wait_time:.1f}s")
                        current_wait_time = new_wait_time
                        update_wait_time(current_wait_time, file_path)
            
            total_wait_times.append(actual_request_time)
            
            print(f"⏸️ Waiting {current_wait_time:.1f}s before next request (last request: {actual_request_time:.1f}s)...", flush=True)
            time.sleep(current_wait_time)
        else:
            total_wait_times.append(actual_request_time)
    
    # Final statistics
    avg_request_time = sum(total_wait_times) / len(total_wait_times) if total_wait_times else 0
    print(f"\n📈 Adaptive batch processing complete!")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"⏱️ Average request time: {avg_request_time:.1f}s")
    print(f"🎯 Final adaptive wait time: {current_wait_time:.1f}s")
    print(f"📁 Results saved in: raw pull")


def process_batch_farms(farm_ids: List[str], api_key: str, wait_time: float, raw_pull_folder: str, chunk_size: int = 50) -> tuple:
    """
    Process farms using batch API calls with the two-step process:
    1. Get long farm IDs from short farm IDs
    2. Use batch API with long IDs
    
    Args:
        farm_ids: List of short farm IDs to process
        api_key: API key for authentication
        wait_time: Wait time between individual API calls
        raw_pull_folder: Folder to save the raw data
        chunk_size: Number of farms to request per batch
        
    Returns:
        Tuple of (successful_count, failed_count)
    """
    print(f"🚀 Starting batch processing of {len(farm_ids)} farms...")
    print(f"📦 Using batch size: {chunk_size} farms per request")
    
    # Step 1: Build mapping from existing files and fetch any missing farms
    print(f"\n🔄 Step 1: Building farm ID mapping from raw files...")
    short_to_long = build_mapping_from_raw_files(farm_ids, api_key, wait_time)
    
    if not short_to_long:
        print("❌ No long farm IDs obtained. Cannot proceed with batch processing.")
        return 0, len(farm_ids)
    
    # Step 2: Use batch API with long IDs
    print(f"\n🔄 Step 2: Fetching farm data using batch API...")
    long_farm_ids = list(short_to_long.values())
    all_farm_data = fetch_farms_batch(long_farm_ids, api_key, chunk_size)
    
    # Check if batch API returned a reasonable number of farms
    expected_farms = len([farm_id for farm_id in farm_ids if farm_id in short_to_long])
    actual_farms = len(all_farm_data)
    success_rate = actual_farms / expected_farms if expected_farms > 0 else 0
    
    print(f"📊 Batch API returned {actual_farms}/{expected_farms} farms ({success_rate:.1%} success rate)")
    
    # If batch API success rate is low, fall back to individual fetching
    if success_rate < 0.8:  # Less than 80% success rate
        print(f"⚠️ Batch API success rate too low ({success_rate:.1%}), falling back to individual fetching...")
        return process_individual_farms(farm_ids, api_key, wait_time, raw_pull_folder)
    
    successful = 0
    failed = 0
    
    # Step 3: Save each farm's data using the original short ID
    print(f"\n💾 Step 3: Saving farm data...")
    for short_id in farm_ids:
        if short_id in short_to_long:
            long_id = short_to_long[short_id]
            if long_id in all_farm_data:
                if save_farm_data(json.dumps(all_farm_data[long_id]), short_id, raw_pull_folder):
                    successful += 1
                    print(f"✅ Saved data for farm {short_id} (long ID: {long_id})")
                else:
                    failed += 1
                    print(f"❌ Failed to save data for farm {short_id}")
            else:
                failed += 1
                print(f"❌ No batch data received for farm {short_id} (long ID: {long_id})")
        else:
            failed += 1
            print(f"❌ No long ID found for farm {short_id}")
    
    return successful, failed


def process_individual_farms(farm_ids: List[str], api_key: str, wait_time: float, raw_pull_folder: str) -> tuple:
    """
    Fall back to individual farm fetching when batch API doesn't work well.
    
    Args:
        farm_ids: List of farm IDs to process
        api_key: API key for authentication
        wait_time: Wait time between individual API calls
        raw_pull_folder: Folder to save the raw data
        
    Returns:
        Tuple of (successful_count, failed_count)
    """
    print(f"🔄 Using individual API fetching for {len(farm_ids)} farms...")
    print(f"⏰ This will take approximately {len(farm_ids) * wait_time / 60:.1f} minutes")
    
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }
    
    successful = 0
    failed = 0
    
    for i, farm_id in enumerate(farm_ids, 1):
        print(f"\n📊 Processing {i}/{len(farm_ids)}: Farm {farm_id}")
        
        url = f"https://api.sunflower-land.com/community/farms/{farm_id}"
        
        # Retry loop for rate limiting
        success = False
        max_retries = 10
        retry_count = 0
        
        while not success and retry_count < max_retries:
            try:
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    farm_data = response.json()
                    if save_farm_data(json.dumps(farm_data), farm_id, raw_pull_folder):
                        successful += 1
                        print(f"✅ Successfully saved farm {farm_id}")
                    else:
                        failed += 1
                        print(f"❌ Failed to save farm {farm_id}")
                    success = True
                elif response.status_code == 429:
                    retry_count += 1
                    print(f"⏳ Rate limited for farm {farm_id} (attempt {retry_count}/{max_retries}), waiting 10s...")
                    time.sleep(10)
                else:
                    print(f"❌ Failed to fetch farm {farm_id}: {response.status_code}")
                    failed += 1
                    success = True
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Error fetching farm {farm_id}: {e}")
                failed += 1
                success = True
        
        if not success:
            print(f"❌ Failed to fetch farm {farm_id} after {max_retries} rate limit retries")
            failed += 1
        
        # Wait between individual calls
        if i < len(farm_ids):
            print(f"⏸️ Waiting {wait_time}s before next request...")
            time.sleep(wait_time)
    
    return successful, failed


def main():
    """
    Main function to run batch farm data fetching.
    Now with option to use batch API or individual requests.
    """
    
    # 🔧 CONFIGURATION - Update these values
    API_KEY = "sfl.YOUR_API_KEY_HERE"  # Replace with your actual Sunflower Land API key
    FARM_IDS_FILE = "farm_ids.txt"
    USE_BATCH_API = False  # Set to False to use individual requests (batch API deprecated)
    BATCH_SIZE = 50  # Number of farms per batch request
    
    # Optional: Read from environment variables
    API_KEY = os.getenv('API_KEY', API_KEY)
    FARM_IDS_FILE = os.getenv('FARM_IDS_FILE', FARM_IDS_FILE)
    USE_BATCH_API = os.getenv('USE_BATCH_API', str(USE_BATCH_API)).lower() == 'true'
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', str(BATCH_SIZE)))
    
    # Validate configuration
    if not API_KEY.startswith("sfl."):
        print("⚠️  Please check the API_KEY format")
        return
    
    # Load farm IDs
    farm_ids, current_wait_time = load_farm_ids(FARM_IDS_FILE)
    
    if not farm_ids:
        print("❌ No farm IDs to process. Please check your farm_ids.txt file.")
        return
    
    # Create/clear raw pull folder
    raw_pull_folder = create_raw_pull_folder()
    
    if USE_BATCH_API:
        print("🔥 Using BATCH API mode for faster processing!")
        start_time = time.time()
        
        successful, failed = process_batch_farms(farm_ids, API_KEY, current_wait_time, raw_pull_folder, BATCH_SIZE)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"\n🎯 Batch processing complete!")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"⏱️ Total time: {total_time:.1f}s")
        print(f"📈 Average time per farm: {total_time/len(farm_ids):.2f}s")
        print(f"📁 Results saved in: raw pull")
        
    else:
        print("� Using INDIVIDUAL API calls (proven reliable method)")
        print(f"⏰ Processing {len(farm_ids)} farms with {current_wait_time}s intervals")
        # Use the original adaptive method
        process_batch_adaptive(farm_ids, API_KEY, current_wait_time, FARM_IDS_FILE)


if __name__ == "__main__":
    main()
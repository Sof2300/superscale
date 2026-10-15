#!/usr/bin/env python3
"""
Find and display multiline duplicate sequences in a text file.
Optimized for speed using a Suffix Array and LCP (Longest Common Prefix) array.
Finds largest sections first, works down to smaller sequences, and prevents overlapping covers.
"""

import os
import sys

def find_duplicates(file_path, min_sequence_length=3):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    # 1. Read lines
    print(f"Reading {file_path}...")
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        raw_lines = f.read().splitlines()
        
    n = len(raw_lines)
    if n < min_sequence_length:
        print("File too short to contain duplicates of that length.")
        return

    # 2. Map unique lines to integer IDs to make comparison instant
    line_to_id = {}
    encoded = []
    for line in raw_lines:
        if line not in line_to_id:
            line_to_id[line] = len(line_to_id)
        encoded.append(line_to_id[line])

    # 3. Build Suffix Array (SA)
    print("Building index...")
    # Trick for massive speedup in Python: convert IDs to characters so string slicing is purely in C
    if len(line_to_id) < 1000000:
        data_view = "".join(chr(val + 1) for val in encoded)
    else:
        # Fallback to tuples if the file has over 1 million UNIQUE lines
        data_view = tuple(encoded)
        
    sa = sorted(range(n), key=lambda x: data_view[x:])

    # 4. Build LCP (Longest Common Prefix) Array using Kasai's algorithm (O(N) time)
    lcp = [0] * n
    rank = [0] * n
    for i, suf in enumerate(sa):
        rank[suf] = i
        
    h = 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and encoded[i+h] == encoded[j+h]:
                h += 1
            lcp[rank[i]] = h
            if h > 0:
                h -= 1

    max_l = max(lcp) if lcp else 0
    if max_l < min_sequence_length:
        print("No multiline duplicate sequences found.")
        return

    # 5. Find duplicates strictly from largest possible down to smallest
    print(f"Searching... Max possible duplicate block is {max_l} lines long.\n")
    is_covered = [False] * n
    total_duplicates_found = 0

    for L in range(max_l, min_sequence_length - 1, -1):
        i = 1
        while i < n:
            # Whenever adjacent suffixes share a prefix of length L or more, group them
            if lcp[i] >= L:
                current_group = [sa[i - 1]]
                while i < n and lcp[i] >= L:
                    current_group.append(sa[i])
                    i += 1
                
                # Sort start indices left-to-right to greedily pick non-overlapping chunks
                current_group.sort()
                valid_starts = []
                last_end = -1
                
                for start in current_group:
                    # Check against self-overlap AND previously covered larger matches
                    if start > last_end:
                        # Fast check if ANY part of this block is already covered
                        if True not in is_covered[start : start + L]:
                            valid_starts.append(start)
                            last_end = start + L - 1
                
                # If we still have 2 or more valid, completely clean instances
                if len(valid_starts) >= 2:
                    total_duplicates_found += 1
                    line_ranges = [(s + 1, s + L) for s in valid_starts]  # +1 for 1-based indexing, s+L for ending line
                    
                    print(f"Found duplicate sequence of {L} line(s):")
                    print("=" * 60)
                    print(f"Sequence appears {len(valid_starts)} times at lines:")
                    for start, end in line_ranges:
                        print(f"  {start}-{end}")
                    print("Content:")
                    for line in raw_lines[valid_starts[0] : valid_starts[0] + L]:
                        print(f"  {line}")
                    print("-" * 60 + "\n")
                    
                    # Mark all participating lines as completely covered
                    for start in valid_starts:
                        is_covered[start : start + L] = [True] * L
            else:
                i += 1

    if total_duplicates_found == 0:
        print("No multiline duplicate sequences found.")
    else:
        print(f"Finished. Found {total_duplicates_found} multiline duplicate blocks in total.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python find_duplicates.py <file_path> [min_sequence_length]")
        print("Example: python find_duplicates.py alldata/data.txt 3")
        sys.exit(1)
    
    target_file = sys.argv[1]
    min_sequence_length = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    find_duplicates(target_file, min_sequence_length=min_sequence_length)
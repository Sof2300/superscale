#!/usr/bin/env python3
"""
Clean data file by processing 'cancel' commands.
Features:
- Removes cancel commands and their targets.
- Normalizes dates to D/M/YY.
- Pauses to allow manual correction of lines with >3 commas.
- Removes successive identical lines (keeps only one).
- Prints detailed logs of actions taken.
"""

from collections import defaultdict
import os

def normalize_date(date_str):
    """
    Takes a date string (e.g., '  05/09/2016') and normalizes it to '  5/9/16' (D/M/YY).
    Preserves any leading whitespace.
    """
    original_spaces = len(date_str) - len(date_str.lstrip())
    prefix = date_str[:original_spaces]
    clean_date = date_str.strip()
    
    # Determine if it's using slashes or dashes
    sep = '/' if '/' in clean_date else '-' if '-' in clean_date else None
    
    if sep:
        parts = clean_date.split(sep)
        if len(parts) == 3:
            try:
                # Remove leading zeros from day and month
                d = str(int(parts[0]))
                m = str(int(parts[1]))
                y = parts[2].strip()
                
                # Normalize year to YY (2 digits)
                if len(y) == 4:
                    y = y[-2:]
                elif len(y) == 1:
                    y = '0' + y
                    
                return f"{prefix}{d}/{m}/{y}"
            except ValueError:
                pass # If it fails to parse as ints, return original
                
    return date_str

def clean_data(input_file, output_file):
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    print(f"Reading {input_file}...\n")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_lines = f.read().splitlines()

    result_lines = []
    
    # Track the active history of each ID
    # id_history['N296'] = [(index_in_result_lines, original_line_num, action_name, full_line), ...]
    id_history = defaultdict(list)
    
    # Track which original line numbers get cancelled
    cancelled_lines = set()
    
    # Store cancel details for later re-printing with accurate intervening info
    cancel_operations = []
    
    cancels_processed = 0
    ignore_comma_warnings = False

    for i, raw_line in enumerate(raw_lines):
        original_line_num = i + 1
        
        # --- 1. MANUAL CORRECTION CHECK ---
        while raw_line.count(',') > 3 and not ignore_comma_warnings:
            print(f"\n[!] WARNING: Line {original_line_num} has more than 3 commas ({raw_line.count(',')} commas).")
            print(f"    Original: {raw_line}")
            print("    Please type the corrected line.")
            print("    (Press Enter to keep it as-is, or type 'IGNORE ALL' to skip future warnings)")
            
            user_input = input("    > ")
            
            if user_input.strip().upper() == 'IGNORE ALL':
                ignore_comma_warnings = True
                print("    Skipping all future comma warnings.")
                break
            elif not user_input:
                print("    Keeping original line.")
                break
            else:
                raw_line = user_input
                if raw_line.count(',') <= 3:
                    print("    Correction accepted!")
                else:
                    print("    Correction still has more than 3 commas. Try again.")

        # --- 2. DATE NORMALIZATION ---
        parts = raw_line.split(',')
        if len(parts) >= 1:
            parts[0] = normalize_date(parts[0])
            raw_line = ','.join(parts) # Reconstruct line with normalized date

        # --- 3. CANCEL LOGIC ---
        # Strip spaces from parts just to do the logic checks safely
        logic_parts = [p.strip() for p in parts]
        
        if len(logic_parts) >= 3:
            uid = logic_parts[1]
            action = logic_parts[2]
            arg = logic_parts[3] if len(logic_parts) > 3 else ""
            
            if action == 'cancel':
                target_idx = -1
                history = id_history[uid]
                target_original_num = -1
                target_action = ""
                target_line = ""
                
                if arg:
                    # Search backward for the most recent matching ARG for this ID
                    for j in range(len(history) - 1, -1, -1):
                        if history[j][2] == arg:
                            target_idx = history[j][0]
                            target_original_num = history[j][1]
                            target_action = history[j][2]
                            target_line = history[j][3]
                            # Check for intervening commands (those after the target in history)
                            intervening = history[j+1:] if j+1 < len(history) else []
                            history.pop(j)
                            break
                else:
                    # No ARG - Grab the very last action for this ID
                    if history:
                        target_idx = history[-1][0]
                        target_original_num = history[-1][1]
                        target_action = history[-1][2]
                        target_line = history[-1][3]
                        # No intervening commands when cancelling the most recent one
                        intervening = []
                        history.pop()
                
                # Execute the cancel if a target was found
                if target_idx != -1:
                    result_lines[target_idx] = None
                    cancelled_lines.add(target_original_num)
                    cancels_processed += 1
                    # Store cancel operation for later printing
                    cancel_operations.append({
                        'cancel_line_num': original_line_num,
                        'uid': uid,
                        'target_line_num': target_original_num,
                        'cancel_line': raw_line,
                        'target_line': target_line,
                        'intervening': intervening
                    })
                else:
                    print(f"[FAILED] Line {original_line_num} ('{uid}') attempted to cancel '{arg}' but no matching history was found.")
                
                # The 'cancel' command itself is not added to the final output
                result_lines.append(None)
                
            else:
                # Normal command: Add to results and record in history
                result_lines.append(raw_line)
                id_history[uid].append((len(result_lines) - 1, original_line_num, action, raw_line))
        else:
            # Malformed lines (kept as is)
            result_lines.append(raw_line)

    # --- 4. PRINT CANCEL OPERATIONS (with filtered intervening commands) ---
    for op in cancel_operations:
        print(f"[CANCEL] Line {op['cancel_line_num']} ('{op['uid']}') successfully removed Line {op['target_line_num']}")
        print(f"  Cancel line:  {op['cancel_line']}")
        print(f"  Target line:  {op['target_line']}")
        # Filter intervening to only show lines that are NOT cancelled themselves
        uncancelled_intervening = [item for item in op['intervening'] if item[1] not in cancelled_lines]
        if uncancelled_intervening:
            print(f"  *** {len(uncancelled_intervening)} UNCANCELLED intervening command(s) between target and cancel: ***")
            for idx, orig_num, act, line in uncancelled_intervening:
                print(f"    Line {orig_num}: {line}")

    # --- 5. REMOVE SUCCESSIVE IDENTICAL LINES ---
    final_output = [line for line in result_lines if line is not None]
    
    deduplicated = []
    duplicates_removed = 0
    dup_count = 0
    dup_start_idx = -1
    
    for i, line in enumerate(final_output):
        if not deduplicated or line != deduplicated[-1]:
            # If we were counting duplicates, print them before adding new line
            if dup_count > 0:
                print(f"[DEDUPLICATE] Removed {dup_count} successive duplicate(s):")
                # Show previous line for context
                if dup_start_idx > 0:
                    print(f"  Previous: {final_output[dup_start_idx - 1]}")
                # Show the line being kept
                print(f"  Kept:     {deduplicated[-1]}")
                # Show each duplicate being removed
                for _ in range(dup_count):
                    print(f"  Removed:  {deduplicated[-1]}")
                # Show next line for context
                if i < len(final_output):
                    print(f"  Next:     {line}")
                duplicates_removed += dup_count
                dup_count = 0
                dup_start_idx = -1
            deduplicated.append(line)
        else:
            if dup_count == 0:
                dup_start_idx = i - 1
            dup_count += 1
    
    # Print any remaining duplicates at the end
    if dup_count > 0:
        print(f"[DEDUPLICATE] Removed {dup_count} successive duplicate(s):")
        # Show previous line for context
        if dup_start_idx > 0:
            print(f"  Previous: {final_output[dup_start_idx - 1]}")
        # Show the line being kept
        print(f"  Kept:     {deduplicated[-1]}")
        # Show each duplicate being removed
        for _ in range(dup_count):
            print(f"  Removed:  {deduplicated[-1]}")
        duplicates_removed += dup_count
    
    final_output = deduplicated

    # --- 6. EXPORT FINAL FILE ---
    with open(output_file, 'w', encoding='utf-8') as f:
        for line in final_output:
            f.write(line + '\n')

    # Summary Output
    original_count = len(raw_lines)
    final_count = len(final_output)
    removed_count = original_count - final_count
    
    print("\n" + "="*30)
    print("      CLEANING COMPLETE      ")
    print("="*30)
    print(f"Original lines:   {original_count}")
    print(f"Cancels matched:  {cancels_processed}")
    print(f"Duplicates removed: {duplicates_removed}")
    print(f"Lines removed:    {removed_count} (Cancel targets + the cancel commands + duplicates)")
    print(f"Final file lines: {final_count}")
    print(f"Saved to:         {output_file}")


if __name__ == "__main__":
    # Define your paths here
    input_path = 'alldata/data.txt'
    output_path = 'alldata/data_cleaned.txt'
    
    clean_data(input_path, output_path)
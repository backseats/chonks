import csv
import json
import os

def csv_to_json(csv_file_path, output_dir):
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Extract the base name of the file and create a new JSON file path
    base_name = os.path.basename(csv_file_path)
    json_file_path = os.path.join(output_dir, base_name.replace('.csv', '.json'))

    with open(csv_file_path, 'r') as csv_file:
        csv_reader = csv.reader(csv_file)
        data = [row[0].strip() for row in csv_reader if row]

    with open(json_file_path, 'w') as json_file:
        json.dump(data, json_file, indent=2)

def main():
    csv_files = [
        './friends-updated.csv',
        './creator-updated.csv',
        './collections-updated.csv'
    ]

    output_dir = './outputs'

    for csv_file in csv_files:
        csv_to_json(csv_file, output_dir)
        print(f"Converted {csv_file} to {os.path.join(output_dir, os.path.basename(csv_file).replace('.csv', '.json'))}")

if __name__ == "__main__":
    main()

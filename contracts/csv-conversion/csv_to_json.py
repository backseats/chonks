import csv
import json
import datetime
import sys

def csv_to_json(csv_file_path, json_file_path):
  data = {"traits": []}

  with open(csv_file_path, mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)

    for row in csv_reader:
      trait = {
        "id": int(row["Index"]),
        "name": row["Trait Name"],
        "category": row["Category (e.g. Bottom)"] if row["Category (e.g. Bottom)"] else "Handheld",  # Default to "Handheld" if category is empty
        "animation": row["Animation"] if row["Animation"] else "",
        "colorMap": row["Color Map"],
        "zMap": row["z Map"]
      }
      data["traits"].append(trait)

  with open(json_file_path, mode='w') as json_file:
    json.dump(data, json_file, indent=4)

# Get CSV file path from command line argument
if len(sys.argv) < 2:
  print("Please provide the path to your CSV file as a command-line argument.")
  sys.exit(1)

csv_file_path = sys.argv[1]
current_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
json_file_path = f"output_{current_time}.json"  # Output file with current date and time

# Convert CSV to JSON
csv_to_json(csv_file_path, json_file_path)

print(f"CSV file has been successfully converted to JSON and saved as {json_file_path}")
import csv
import datetime

def csv_to_solidity_commands(csv_file_path):
  solidity_commands = []

  with open(csv_file_path, mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)

    for row in csv_reader:
      trait_index = row["Index"]
      trait_name = row["Trait Name"]
      category = row["Category (e.g. Pants)"] if row["Category (e.g. Pants)"] else "Handheld"
      animation = row["Animation"] if row["Animation"] else ""
      color_map = row["Color Map"]
      z_map = row["z Map"]

      # Format Solidity command
      command = f'addNewTrait({trait_index}, "{trait_name}", TraitCategory.Name.{category}, "{animation}", hex"{color_map}", hex"{z_map}");'
      solidity_commands.append(command)

  return solidity_commands

# Path to the input CSV file
csv_file_path = "031024-2-master.csv"

# Convert CSV to Solidity commands
commands = csv_to_solidity_commands(csv_file_path)

# Get current time and date for the filename
current_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
txt_file_path = f"solidity_commands_{current_time}.txt"

# Output the commands to a .txt file
with open(txt_file_path, mode='w') as txt_file:
  for command in commands:
    txt_file.write(command + "\n")

print(f"Solidity commands have been successfully saved to {txt_file_path}")
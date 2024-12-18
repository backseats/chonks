import csv

# Read the input CSV file
with open('chonk_tba_mapping.csv', 'r') as infile:
    # Skip the header row
    next(infile)
    # Create a dictionary to store TBA address -> Chonk ID mapping
    tba_to_chonk = {}

    # Read each line and store in dictionary
    reader = csv.reader(infile)
    for row in reader:
        chonk_id = int(row[0])
        tba_address = str(row[1])
        tba_to_chonk[tba_address] = chonk_id

# Write the output CSV file
with open('chonks_tba_to_chonk_id.csv', 'w', newline='') as outfile:
    writer = csv.writer(outfile)
    # Write header
    writer.writerow(['TBA Address', 'Chonk Id'])

    # Write data rows sorted by Chonk ID
    sorted_items = sorted(tba_to_chonk.items(), key=lambda x: x[1])
    for tba_address, chonk_id in sorted_items:
        writer.writerow([tba_address, chonk_id])

print("Created chonks_tba_to_chonk_id.csv successfully!")

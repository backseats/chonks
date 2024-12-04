import pandas as pd

# Load CSV files into DataFrames
creator_df = pd.read_csv('./creator.csv', header=None, names=['address'])
friends_df = pd.read_csv('./friends.csv', header=None, names=['address'])
collections_df = pd.read_csv('./collections.csv', header=None, names=['address'])

# Remove duplicates within each list
creator_df = creator_df.drop_duplicates()
friends_df = friends_df.drop_duplicates()
collections_df = collections_df.drop_duplicates()

# Remove addresses from lower tiers if they exist in higher tiers
# Remove from friends if in creator
friends_df = friends_df[~friends_df['address'].isin(creator_df['address'])]
# Remove from collections if in creator or friends
collections_df = collections_df[~collections_df['address'].isin(creator_df['address'])]
collections_df = collections_df[~collections_df['address'].isin(friends_df['address'])]

# Save updated CSV files
creator_df.to_csv('./creator-updated.csv', index=False, header=False)
friends_df.to_csv('./friends-updated.csv', index=False, header=False)
collections_df.to_csv('./collections-updated.csv', index=False, header=False)

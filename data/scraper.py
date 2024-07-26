import requests
from bs4 import BeautifulSoup

base_url = "https://www.shavebdika.org.il/ResultsPage2.aspx"
params = {
    "pregnent": 0,
    "Bodyhight": 165,
    "Bodywieght": 70,
    "Smoking": 2,
    "monthBirth": 1,
    "DayBirth": 1
}

# Initialize a shared dictionary to hold unique pairs with unique IDs
unique_pairs = {}
# Initialize a counter for unique IDs
id_counter = 0

# Initialize a mapping between parameters and the list of pair IDs
param_to_pair_ids_mapping = {}

def try_parse(html_text):
    global id_counter
    # Parse the HTML
    soup = BeautifulSoup(html_text, 'html.parser')

    # Find the wrapper div
    wrapper_div = soup.find('div', id='ContentPlaceHolder1_MainMessagePanel2')

    # Initialize a list to hold the pair IDs for the current page
    pair_ids = []

    # Check if the wrapper div was found
    if wrapper_div:
        # Find all span elements with class 'entry'
        span_elements = wrapper_div.find_all('span', class_='entry')

        for span in span_elements:
            # Get the text inside the span element
            entry_text = span.get_text(strip=True)

            # Find the next sibling div with an id starting with 'DivRepair'
            next_div = span.find_next_sibling('div', id=lambda x: x and x.startswith('DivRepair'))

            if next_div:
                # Get the text inside the found div
                repair_text = next_div.get_text(strip=True)
                # Create the pair
                pair = (entry_text, repair_text)
                # Check if the pair is already in the unique_pairs dictionary
                if pair not in unique_pairs.values():
                    # Add the pair with a unique ID
                    unique_pairs[id_counter] = pair
                    pair_ids.append(id_counter)
                    id_counter += 1
                else:
                    # Find the existing ID for the pair
                    existing_id = next(key for key, value in unique_pairs.items() if value == pair)
                    pair_ids.append(existing_id)

    return pair_ids

# Iterate over the parameters and store the mapping
for year in range(1910, 2007):
    for male in [True, False]:
        params["Male"] = str(male)
        params["YearBirth"] = year
        response = requests.get(base_url, params=params)
        print(f"Response for Year: {year}, Male: {male}")
        pair_ids = try_parse(response.text)
        param_to_pair_ids_mapping[(year, male)] = pair_ids

# Print the mapping between parameters and the list of pair IDs
for params, pair_ids in param_to_pair_ids_mapping.items():
    print(f"Parameters: YearBirth={params[0]}, Male={params[1]}")
    for pair_id in pair_ids:
        print(f"ID: {pair_id}, Pair: {unique_pairs[pair_id]}")

# Print all unique pairs with their IDs
print("All Unique Pairs with IDs:")
for pair_id, pair in unique_pairs.items():
    print(f"ID: {pair_id}, Pair: {pair}")

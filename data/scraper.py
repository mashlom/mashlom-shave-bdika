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

# Initialize shared dictionaries to hold unique pairs with unique IDs for both cases
unique_pairs_wellbeing = {}
unique_pairs_medical = {}
# Initialize counters for unique IDs for both cases
id_counter_wellbeing = 0
id_counter_medical = 0

# Initialize a mapping between parameters and the list of pair IDs for both cases
param_to_pair_ids_mapping = {}


def get_wrapper_div(soup, case_name):
    if case_name == 'wellbeing':
        return soup.find('div', id='ContentPlaceHolder1_MainMessagePanel2')
    elif case_name == 'medical':
        return soup.find('div', class_='innerTopText')


def update_unique_pairs(case_name, pair, pair_ids):
    global id_counter_wellbeing, id_counter_medical

    if case_name == 'wellbeing':
        unique_pairs, id_counter = unique_pairs_wellbeing, id_counter_wellbeing
    elif case_name == 'medical':
        unique_pairs, id_counter = unique_pairs_medical, id_counter_medical

    if pair not in unique_pairs.values():
        unique_pairs[id_counter] = pair
        pair_ids.append(id_counter)
        id_counter += 1
    else:
        existing_id = next(key for key, value in unique_pairs.items() if value == pair)
        pair_ids.append(existing_id)

    if case_name == 'wellbeing':
        id_counter_wellbeing = id_counter
    elif case_name == 'medical':
        id_counter_medical = id_counter


def try_parse(html_text, case_name):
    soup = BeautifulSoup(html_text, 'html.parser')
    wrapper_div = get_wrapper_div(soup, case_name)
    pair_ids = []

    if wrapper_div:
        span_elements = wrapper_div.find_all('span', class_='entry')
        for span in span_elements:
            entry_text = span.get_text(strip=True)
            next_div = span.find_next_sibling('div', id=lambda x: x and x.startswith('DivRepair'))
            if next_div:
                repair_text = next_div.get_text(strip=True)
                pair = (entry_text, repair_text)
                update_unique_pairs(case_name, pair, pair_ids)

    return pair_ids


def fetch_data_and_parse():
    for year in range(2006, 2023):
        for male in [True, False]:
            params["Male"] = str(male)
            params["YearBirth"] = year

            response = requests.get(base_url, params=params)
            print(f"Response for Year: {year}, Male: {male}")

            wellbeing_pair_ids = try_parse(response.text, case_name='wellbeing')
            medical_pair_ids = try_parse(response.text, case_name='medical')

            param_to_pair_ids_mapping[(year, male)] = {
                'wellbeing_case': wellbeing_pair_ids,
                'medical_case': medical_pair_ids
            }


def print_mappings_and_pairs():
    for params, pair_ids in param_to_pair_ids_mapping.items():
        print(f"Parameters: YearBirth={params[0]}, Male={params[1]}")
        print("Wellbeing Case Pair IDs:")
        for pair_id in pair_ids['wellbeing_case']:
            print(f"ID: {pair_id}, Pair: {unique_pairs_wellbeing[pair_id]}")
        print("Medical Case Pair IDs:")
        for pair_id in pair_ids['medical_case']:
            print(f"ID: {pair_id}, Pair: {unique_pairs_medical[pair_id]}")

    print("All Unique Pairs for Wellbeing Case with IDs:")
    for pair_id, pair in unique_pairs_wellbeing.items():
        print(f"ID: {pair_id}, Pair: {pair}")

    print("All Unique Pairs for Medical Case with IDs:")
    for pair_id, pair in unique_pairs_medical.items():
        print(f"ID: {pair_id}, Pair: {pair}")


# Execute the functions
fetch_data_and_parse()
print_mappings_and_pairs()

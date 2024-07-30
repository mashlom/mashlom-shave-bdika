import json
import pandas as pd


def read_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)


def create_age_ranges(ages):
    if not ages:
        return ''

    ages = sorted(set(ages))
    ranges = []
    start = ages[0]
    end = ages[0]

    for age in ages[1:]:
        if age == end + 1:
            end = age
        else:
            if start == end:
                ranges.append(f"{start}")
            else:
                ranges.append(f"{start}-{end}")
            start = age
            end = age

    if start == end:
        ranges.append(f"{start}")
    else:
        ranges.append(f"{start}-{end}")

    return ', '.join(ranges)


def process_data(data, mapping_data, case_type):
    processed_data = []
    for item in data:
        id_ = item['id']
        applied_male = []
        applied_female = []
        for key, value in mapping_data.items():
            age, is_male = key.split(',')
            age = int(age)
            is_male = is_male.lower() == 'true'
            if id_ in value[case_type]:
                if is_male:
                    applied_male.append(age)
                else:
                    applied_female.append(age)
        processed_data.append({
            'id': id_,
            'title': item['title'],
            'description': item['description'],
            'applyed Male': create_age_ranges(applied_male),
            'applyed Female': create_age_ranges(applied_female)
        })
    return processed_data


def create_excel(medical_data, wellbeing_data, mapping_data, output_file):
    # Process the data
    medical_processed = process_data(medical_data, mapping_data, 'medical_case')
    wellbeing_processed = process_data(wellbeing_data, mapping_data, 'wellbeing_case')

    # Convert to DataFrame
    medical_df = pd.DataFrame(medical_processed)
    wellbeing_df = pd.DataFrame(wellbeing_processed)

    # Write to Excel file
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        medical_df.to_excel(writer, sheet_name='Medical', index=False)
        wellbeing_df.to_excel(writer, sheet_name='Wellbeing', index=False)


# File paths
medical_file = 'medical_advice_pairs.json'
wellbeing_file = 'well_being_pairs.json'
mapping_file = 'age_sex_to_data_mapping.json'
output_file = 'output.xlsx'

# Read JSON files
medical_data = read_json(medical_file)
wellbeing_data = read_json(wellbeing_file)
mapping_data = read_json(mapping_file)

# Create Excel file
create_excel(medical_data, wellbeing_data, mapping_data, output_file)

from flask import Flask, request, Response
from  flask_cors  import CORS,  cross_origin
import time
import random
import openai 
import survey_prompts
import hashlib, json
from ast import literal_eval


def parse_event_info(text):
    # Splitting the input text into lines
    lines = text.split('\n')

    # Initializing the dictionary and array
    event_info = {}
    questions_array = []

    for line in lines:
        # Check if line contains event description
        if line.startswith('*Event Description*:'):
            # Remove the brackets and set the event description
            event_info['Event Description'] = line[20:].strip()

        # Check if line contains text
        elif line.startswith('**Text**:'):
            if 'Text' not in event_infO:
                event_info['Text'] = {}
            else:
                event_info['Text'][len(questions_array)] = line[9:].strip()


        # Check if line contains a question
        elif line.startswith('**Question'):
            # Extract question number(s)
            line = line[10:]
            question_part = line.split('**:', 1)[0]
            question_text = line.split('**:', 1)[1].strip()

            # Check for range in question numbers
            if '-' in question_part:
                start_num, end_num = [int(num) for num in question_part.split('-')]
                # Repeat question for each number in the range
                questions_array.append(question_text)
                for _ in range(end_num - start_num):
                    questions_array.append(("Continue prior questioning on " + question_text, True))
            else:
                questions_array.append((question_text, False))

    return event_info['Event Description'], event_info['Text'], questions_array


surveys = {}
#Surveys will have a Text key associated to an array, a strat_arr key  associated to tuples of questions + whether they need GPT
#There also are event descriptions and stored versions of raw_text. Need to make everything more uniform and test sections of the pipeline.
#MIGHT JUST BE BETTER TO HAVE "NEED GPT" AS A SET AND HAVE BOTH TEXT + QUESTIONS IN QUESTIONS ARR

def save_surveys():
    with open("surveys.json", "w") as file:
        json.dump(surveys, file)

# Function to load surveys from a file
def load_surveys():
    try:
        with open("surveys.json", "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return {}
    
surveys = load_surveys()

openAIKey = ""
with open("OpenAIKey.txt","r") as f:
    openai.api_key = f.read()

app = Flask(__name__)

cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'   


@app.route("/", methods = ["POST"])
def create_survey():
    dic = request.get_json()
    userInput = dic["text"]
    prompt = survey_prompts.survey_generation_prompt + userInput
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # Use "gpt-4" if available, otherwise use "gpt-3.5-turbo"
        messages=[{"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=300 #up this later
    )

    hash_key = hashlib.md5(userInput.encode()).hexdigest()
    event_desc,text, question_arr = parse_event_info(response, hash_key)
    surveys[hash_key] = {"user_input": userInput, "strategy": response, "strat_arr": question_arr, "event_desc": event_desc, "text": text}

    save_surveys()

    return {"text": response, "key": hash_key}


@app.route("/",  methods = ["GET"])
def init_survey():
    dic = request.get_Json()
    key = dic["key"]
    strat_msgs  = surveys[key]["strat_arr"]
    init_ques = []
    i  = 0
    while(i < len(strat_msgs)):
        if strat_msgs[i][1]: 
            return {"questions": init_ques}
        init_ques.append(strat_msgs[i][0])
        i+=1
    return {"questions": init_ques}



@app.route("/", methods = ["POST"]) #Need to ensure Text, when sent, is sent at the right time, processed  properly, and goes over well
def next_question():
    dic = request.get_json()
    qaHistory = dic["qaHistory"]
    key = dic["key"]


    strat_arr = surveys[key]["strat_arr"]
    text = surveys[key]["text"]
    qnum = dic["qnum"]

    if qnum in text: #FIX THIS, WE WILL ALWAYS SEND THE TEXT AS QNUM DOESN't INCREASE. CHANGE TEXT
        #TO ALSO BE STORED IN QUESTION ARRAY
        return {"question":text[qnum], "type":"plain_text", "answer": "demo"}

    if strat_arr[qnum][1]:
        strat_msg = strat_arr[qnum]
        #rather than passing in the whole strategy, maybe just pass in the part about the relevant question 
        prompt = survey_prompts.question_generation_prompt + "\n" + strat_msg[0] + "\n" + qaHistory
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Use "gpt-4" if available, otherwise use "gpt-3.5-turbo"
            messages=[{"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=300 #up this later
        )
        return { "question": response, "type": "comment", "answer": "" }
    else:
        return { "question": strat_arr[qnum], "type": "comment", "answer": "" }

    


# @app.route("/")
# def question_get():
#     time.sleep(1)
#     num = int(random.random()*5)
#     print(num)
#     if num == 0:
#         return {"terminate": "true"}
#     return { "question": "How are you doing?", "type": "comment", "answer": "" }

app.run(port = 8000)
PennController.ResetPrefix(null); // Shorten command names (keep this line here))

DebugOff()   // Uncomment this line only when you are 100% done designing your experiment

const voucher = b64_md5((Date.now() + Math.random()).toString()); // Voucher code generator

var chosenListNum; // Variable to store the selected story number

var items = [
    ["questionnaire", "Form", {html: 'Thank you for completing the experiment. Very briefly, what do you think this study is about?<br/><textarea name="topic" rows="3" cols="50" autofocus="true"></textarea>'}],
    ["questionnaire", "Form", {html: 'How was your experience doing this task? What strategies did you use?<br/><textarea name="strategy" rows="3" cols="50" autofocus="true"></textarea>'}],
    ["questionnaire", "Form", {html: 'What do you think fair pay for this task would be?<input type="text" name="pay" size="10" maxlength="20" autofocus="true"/>'}]
];

// Define a function to randomly select a list number
function selectRandomList() {
    var minListNum = 1;
    var maxListNum = 3; 
    chosenListNum = minListNum + Math.floor(Math.random() * (maxListNum - minListNum + 1));
}

selectRandomList(); // Call the function to select a story

// Load the CSV file and shuffle the rows
const csvFileName = `provo_sentences_questions_${chosenListNum}.csv`;

// Sequence of events: consent to ethics statement required to start the experiment, participant information, instructions, exercise, transition screen, main experiment, result logging, and end screen.
 Sequence("ethics", "setcounter", "participants", "instructions", "practice_items", randomize("experimental_items"), SendResults(), "end")

// This is run at the beginning of each trial
Header(
    // Declare a global Var element "ID" in which we will store the participant's ID
    newVar("ID").global()
    // newVar("HAND").global()
)
.log( "id" , getVar("ID"))
// .log( "hand" , getVar("HAND")); // Add the ID to all trials' results lines

// Ethics agreement: participants must agree before continuing
newTrial("ethics",
    newHtml("ethics_explanation", "ethics.html")
        .cssContainer({"margin":"1em", "text-align":"center"})
        .print()
    ,
    newButton("go_to_info", "Proceed")
        .center()
        .cssContainer({"margin":"1em"})
        .print()
        .wait()
);

SetCounter("setcounter");

// Participant information: questions appear as soon as information is input
newTrial("participants",
    defaultText
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,
    newText("participant_info_header", "<div class='fancy'><h2>To evaluate the results we need the following information.</h2><p>You will be anonymous and it will not be possible to identify you later.</p></div>")
    ,
    // Participant ID (6-place)
    newText("participantID", "<b>Please enter your participant ID.</b><br>(please confirm entry by pressing Enter)")
    ,
    newTextInput("input_ID")
        .log()
        .print()
        .wait()
    ,
    // // Handedness
    // newText("<b>Which hand is your dominant hand?</b>")
    // ,
    // newScale("input_hand",   "right", "left", "both")
    //     .radio()
    //     .log()
    //     .labelsPosition("right")
    //     .print()
    //     .wait()
    // ,

    newButton("next", "Go to Instruction")
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
        // Check for participant ID and age input
        .wait(
             newFunction('dummy', ()=>true).test.is(true)
            // ID
            .and( getTextInput("input_ID").testNot.text("")
                .failure( newText('errorID', "Please enter your prolific participant ID.") )
                )
            ),
    // Store the texts from inputs into the Var elements
    getVar("ID")     .set( getTextInput("input_ID") )
    // getVar("HAND")   .set( getScale("input_hand") )
);


// Instructions
newTrial("instructions",
     // Automatically print all Text elements, centered
    defaultText.left().print()
    .cssContainer({"margin-top":"1em"})
    ,
    newText("Welcome to our reading task!")
    ,
    newText("When you begin, you'll see dashed lines on the screen, with each dash representing a hidden word. To reveal the words, press the Right Arrow key (→). If you need to go back and review words, press the Left Arrow key (←) to regress. There's no time limit, so take your time to read and understand the text at your own pace.")
    ,
    newText("The first text is for practice. It will be followed by a comprehension question to test your understanding.")
    ,
    newText("The real reading task will have eighteen texts, each followed by a comprehension question.")
    ,
    newText("When you're ready, click on the button below to start reading. ")
    ,
    newButton("Start")
        .cssContainer({"margin-top":"1em"})
        .center()
        .print()
        .wait()
)

// practice items
Template("provo_sentences_questions_practice.csv", row => {
    var options = [row.Target, row.Distractor];
    shuffle(options);
    
    return newTrial("practice_items",
        newController("DashedSentence", { 
            s: row.Sentence, 
            splitRegex: / / 
            
        })
            .print()
            .log()
            .wait()
            .remove(),
            
        newController("Question", {
            q: row.Question,
            as: options,
            hasCorrect: options.indexOf(row.Target)
        })
            .print()
            .log()
            .wait()
            .remove()
        )
    .log("item", row.Story_Num)
    .log("condition", row.Cond_Num)
    .log('q_id', row.Question_Num);
});

// experimental items
Template(csvFileName, row =>
    newTrial( "experimental_items", 
        options = [row.Target, row.Distractor],
        shuffle(options),
        
        newController("DashedSentence", {
            s : row.Sentence, 
            splitRegex: / /
        })
            .print()
            .log()
            .wait()
            .remove(),
        
        newController("Question", {
            q: row.Question,
            as: options,
            hasCorrect: options.indexOf(row.Target)
        })
            .print()
            .log()
            .wait()
            .remove(),    
            
        newVar("list").set(row.List_Num)
            .log(),
        newVar("item").set(row.Story_Num)
            .log(),
        newVar("condition").set(row.Cond_Num)
            .log(),
        newVar("q_id").set(row.Question_Num)
            .log()
    )
); //closes Template

// Final screen
newTrial("end",
    newText("Thank you for your participation!")
        .center()
        .print()
    ,
    // This link a placeholder: replace it with a URL provided by your participant-pooling platform
    newText("<p><a href='https://app.prolific.com/submissions/complete?cc=C1DMRT46' target='_blank'>Click here to validate your submission</a></p>")
        .center()
        .print()
    ,
    // Trick: stay on this trial forever (until tab is closed)
    newButton().wait()
)
.setOption("countsForProgressBar",false)
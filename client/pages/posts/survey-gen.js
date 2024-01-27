import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { TextField, Paper, Box, Grid,Divider } from '@mui/material';
import Button from '@mui/material/Button';

// Dynamic import with no SSR for ReactMarkdown
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });
const markdown_demo = "\n*Event Description*:  We hosted a 3-day convention for AI enthusiasts with industry panels, leading experts, and constructive workshops.\n***\n**Text**: Thank you for choosing to spend your time with us, and we hope you had a wonderful 3-days. Please answer this brief survey so we can make next time even better!\n\n**Question 1**: What is your name and email?\n\n**Question 2 - 4**: Of the events you attended, which are you most likely to recommend to friends and family? [*AI Continues Questioning*]\n\n**Question 5 - 6**: What was your least favorite part of the convention? What advice would you give for improvement. [*AI Continues Questioning*]\n\n**Question 7**: What can we do better for future conventions?\n\n**Question 8**: Please leave any remaining comments here"
const markdown_demo_txt = "[Event Description: We hosted a 3-day convention for AI enthusiasts with industry panels, leading experts, and constructive workshops.]\n\nT: [Brief thank you and ask them to complete survey] \n\nQ: What is your name and email?\n\nQ3: [Probe for their favorite events]\n\nQ2: [Probe for least favorite events]? \n\nQ: What can we do better for future conventions?\n\nQ: [Any other comments]\n"
const SurveyGen = () => {
    const [input, setInput] = useState('');
    const [final, setFinal] = useState(false)
    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <h2 style={{color: "orange"}}> Form Design </h2>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <TextField
                        label="Survey Design"
                        multiline
                        fullWidth
                        minRows={15}
                        variant="outlined"
                        value={input}
                        onChange={handleInputChange}
                        autofocus
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                        <ReactMarkdown>{convertText(input)}</ReactMarkdown>
                    </Paper>
                </Grid>
            </Grid>
            <Box textAlign="center" my={2}>
                <Button 
                    variant="outlined"
                    size = "large" 
                    disableElevation>
                    {final? "Copy Survey Link":"Finalize Strategy"}
                </Button>
            </Box>
            <Divider sx={{ my: 4 }} /> {/* Horizontal grey line */}
                            {/* Hardcoded markdown text */}
            <h2> Examples </h2>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <TextField
                        label=""
                        multiline
                        fullWidth
                        rows={19}
                        variant="outlined"
                        value = {markdown_demo_txt}
                        disabled
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                        <ReactMarkdown>{markdown_demo}</ReactMarkdown>
                    </Paper>
                </Grid>
            </Grid>
            
        </Box>
    );
};

export default SurveyGen;

function convertText(inputText) {
    let lines = inputText.split('\n');
    let questionCounter = 0;
    let outputText = '';

    lines.forEach(line => {
        // Rule 1: Convert [{variable}:{text}] to *{variable}*: {text} ***
        if (line.match(/^\[.+\:.+\]$/)) {
            let [variable, text] = line.slice(1, -1).split(':');
            outputText += `*${variable.trim()}*: ${text.trim()} \n *** \n`;
        }
        // Rule 2: Convert Q: {text} to **Question {counter}**: {text} [* APPROVED*]
        else if (line.startsWith('Q:')) {
            questionCounter++;
            let text = line.slice(2).trim();
            outputText += `**Question ${questionCounter}**: ${text} \n`;
        }
        else if (line.startsWith('T:')) {
            let text = line.slice(2).trim();
            outputText += `**Text**: ${text} \n`;
        }
        // Rule 3: Convert Q{number}: {text} to **Question {counter} - {counter + number - 1 }**: {text}
        else if (line.match(/^Q\d+\:.+$/)) {
            let parts = line.split(':');
            let number = parseInt(parts[0].slice(1), 10);
            let text = parts[1].trim();
            outputText += `**Question ${questionCounter + 1} - ${questionCounter + number}**: ${text} [*AI Continues Questioning*]\n`;
            questionCounter += number;
        }
        // Lines that don't match any rule are left unchanged
        else {
            outputText += line + '\n';
        }
    });

    return outputText;
}

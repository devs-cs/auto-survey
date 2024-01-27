import Head from 'next/head';
import Layout from './layout';
import React, { useState, useEffect } from 'react';
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import styles from "./InfiniteForm.module.css";
import axios from 'axios';

import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function InfiniteForm() {
    const init = [
        { question: "Thank you for choosing to spend your time with us, and we hope you had a wonderful 3-days. Please answer this brief survey so we can make next time even better!", type: "plain_text", answer: "dmeo" },
        { question: "What is your full name", desc: "", type: "comment", answer: "" },
        { question: "What is your email address?", type: "comment", answer: "" }
    ];
    const total_questions = 10
    const [questions, setQuestions] = useState(init);
    const [loading, setLoading] = useState(false);
    const [pageY, setPageY] = useState(0);
    const [end, setEnd] = useState(false)
    console.log(questions)
    const surveyJson = {
        elements: questions.map((obj, idx) => {
            if (obj.type === "plain_text") {
                return {
                    type: "html",
                    name: `Q${idx}`,
                    html: `${obj.question}` // Your message here
                };
             } else {
            return {
                name: `Q${idx}`,
                title: obj.question,
                type: obj.type,
                allowResize: false,
                autoGrow: true,
                rows: 1,
                defaultValue: obj.answer,
                isRequired: true,
                visible: questions.slice(0, idx).every(q => q.answer !== ""),
                description: (obj.desc == "" && idx == 1) ? "Use ENTER for multiple lines and TAB/ESC for the next question to appear": obj.desc
            };
        }})
    };


    const survey = new Model(surveyJson);
    survey.showNavigationButtons = end;

    survey.onValueChanged.add(function (sender, options) {
        setPageY(window.scrollY);
        const idx = parseInt(options.name.substring(1));
        setQuestions(questions => {
            const newQuestions = [...questions];
            newQuestions[idx].answer = options.value;
            return newQuestions;
        });
    });

    const alertResults = (sender) => {
        const results = JSON.stringify(sender.data);
        alert(results);
    };

    survey.onComplete.add(alertResults);

    useEffect(() => {
        const fetchNewQuestion = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:8000/');
                console.log(response)
                if (response.data && response.data.terminate){
                    setEnd(true)
                }
                else if (response.data && response.data.question) {
                    setQuestions(prevQuestions => [...prevQuestions, response.data]);
                }
            } catch (error) {
                console.error('Error fetching new question:', error);
            }
            setLoading(false);
        };

        const filledQuestions = questions.filter(q => q.answer !== "");
        if (filledQuestions.length === questions.length) {
            fetchNewQuestion();
        }
        window.scrollTo({
            top: pageY + 200,
            behavior: 'smooth'
        });
    }, [questions, pageY]);
    console.log(end)
    
    return (
        <div className={end ? '': styles.container}>
            <Layout>
                <Head>
                    <title>Survey</title>
                </Head>
    
                {/* Sticky Progress Bar */}
                <div className={styles.stickyProgressBar}>
                    <Box sx={{ width: '100%' }}>
                        <LinearProgressWithLabel value={questions.filter(q => q.answer !== "").length/total_questions * 100} />
                    </Box>
                </div>
    
                <Survey model={survey} />
                
                <Box sx={{ 
    width: '100%', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F3F3F3' 
}}>
    {loading ? <LinearProgress style={{ width: '40%' }} /> : <div></div>}
</Box>

            </Layout>
        </div>
    );
    
}


function LinearProgressWithLabel(props) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body1" color="text.secondary">{`${Math.round(
            props.value,
          )}%`}</Typography>
        </Box>
      </Box>
    );
  }
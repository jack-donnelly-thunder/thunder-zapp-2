const { App, AwsLambdaReceiver } = require('@slack/bolt');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_API_KEY,
});
const openai = new OpenAIApi(configuration);
/* 
This sample slack application uses SocketMode
For the companion getting started setup guide, 
see: https://slack.dev/bolt-js/tutorial/getting-started 
*/
const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initializes your app with your bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
});
/*app.event('app_mention', async ({ event, content, say }) => {
  try{
    const appID = 'A051199E413';
      // Start a thread on the original message
    
    var messages = [
      
    ]
    if (!event.thread_ts) {
      console.log("no thread hit" + event.text);
      messages.push({"role": "user", "content": event.text.split('> ')[1]});
      console.log(JSON.stringify(messages));
      console.log(event.text.split('> ')[1]);
      const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: event.channel,
        thread_ts: event.ts,
        text: result.data.choices[0].message.content
      });
    } 
    else {
      const result = await app.client.conversations.history({
        channel: event.channel,
        latest: event.ts,
        limit: 1,
      });
      const threadstart = result.messages;
      const originalMessage = threadstart[0];
      console.log('second call' + JSON.stringify(threadstart));
      const threadResult = await app.client.conversations.replies({
        channel: event.channel,
        ts: originalMessage.ts,
      });
      console.log('Thread length' + JSON.stringify(threadResult.messages));
      const totalThread = threadResult.messages
      for(const tmessage of totalThread ){
        //HERE IS THE ISSUE WITH BOT CHECK
        if (undefined != tmessage.bot_id){
          messages.push({"role": "assistant", "content": tmessage.text});
          console.log('Thread bot ' + tmessage.text);
        }
        else{
          messages.push({"role": "user", "content": tmessage.text.split('> ')[1]});
          console.log('Thread human ' + tmessage.text);

        }
      }
      console.log(JSON.stringify(messages));
      //console.log('threaded messages ' + JSON.stringify(messages));
      const chatresult = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });
      // If there are existing replies, add a new message to the thread
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: event.channel,
        thread_ts: event.ts,
        text: chatresult.data.choices[0].message.content
      });
    }
  //await say(result.data.choices[0].message.content);
 
}
  catch(error){
    await say(error.message);
  }
});*/


app.event('message', async ({ event, context }) => {
  //Only react to DMs
  if (event.channel_type === 'im') {
    try{
          
      var messages = [ ];
      //Checking if there's an existing thread
      if (!event.thread_ts) {
       // console.log('No thread hit' + JSON.stringify(event));
        //If no thread, we'll do a simple push to openai and start a new thread
        messages.push({"role": "user", "content": event.text});
  
        const result = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messages,
        });
        //console.log(JSON.stringify(messages));
        await app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: event.channel,
          thread_ts: event.ts,
          text: result.data.choices[0].message.content
        });
      } 
      else {
        //If there is an existing thread we'll need to gather up the content of the thread
        //And make a call with all past messages to remember the context of the chat
        //console.log('thread event:' + JSON.stringify(event));
        const result = await app.client.conversations.history({
          channel: event.channel,
          latest: event.ts,
          limit: 1,
        });
        const threadstart = result.messages;
        const originalMessage = threadstart[0];
        //console.log('second call' + JSON.stringify(threadstart));
        const threadResult = await app.client.conversations.replies({
          channel: event.channel,
          ts: event.thread_ts,
        });
        //console.log(JSON.stringify('context test' + threadResult));

        //console.log('Thread length' + JSON.stringify(threadResult.messages));
        const totalThread = threadResult.messages
        for(const tmessage of totalThread ){
          if (undefined != tmessage.bot_id){
            messages.push({"role": "assistant", "content": tmessage.text});
            //console.log('Thread bot ' + tmessage.text);
          }
          else{
            messages.push({"role": "user", "content": tmessage.text});
            //console.log('Thread human ' + tmessage.text);
          }
        }
        //console.log('threaded messages ' + JSON.stringify(messages));
        const chatresult = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messages,
        });
        // If there are existing replies, add a new message to the thread
        await app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: event.channel,
          thread_ts: event.ts,
          text: chatresult.data.choices[0].message.content
        });
      }
    //await say(result.data.choices[0].message.content);
   
  }
    catch(error){
      //In the case of errors put the error in chat
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: event.channel,
        thread_ts: event.ts,
        text: error.message
      });
    }
  }
});
// Listens to incoming messages that contain "hello"
/*app.message('Zapp: ', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered

  try{
    
    const appID = 'A051199E413';
      // Start a thread on the original message
    
    var messages = [
      
    ]
    if (!message.thread_ts) {
      console.log("no thread hit");
      messages.push({"role": "user", "content": message.text.split('Zapp: ')[1]});

      const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });
      console.log(JSON.stringify(messages));
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: message.channel,
        thread_ts: message.ts,
        text: result.data.choices[0].message.content
      });
    } 
    else {
      const result = await app.client.conversations.history({
        channel: message.channel,
        latest: message.ts,
        limit: 1,
      });
      const threadstart = result.messages;
      const originalMessage = threadstart[0];
      console.log('second call' + JSON.stringify(threadstart));
      const threadResult = await app.client.conversations.replies({
        channel: message.channel,
        ts: originalMessage.ts,
      });
      console.log('Thread length' + JSON.stringify(threadResult.messages));
      const totalThread = threadResult.messages
      for(const tmessage of totalThread ){
        //HERE IS THE ISSUE WITH BOT CHECK
        if (undefined != tmessage.bot_id){
          messages.push({"role": "assistant", "content": tmessage.text});
          console.log('Thread bot ' + tmessage.text);
        }
        else{
          messages.push({"role": "user", "content": tmessage.text.split('Zapp: ')[1]});
          console.log('Thread human ' + tmessage.text);

        }
      }
      console.log(JSON.stringify(messages));
      //console.log('threaded messages ' + JSON.stringify(messages));
      const chatresult = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });
      // If there are existing replies, add a new message to the thread
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: message.channel,
        thread_ts: message.ts,
        text: chatresult.data.choices[0].message.content
      });
    }
  //await say(result.data.choices[0].message.content);
 
}
  catch(error){
    await say(error.message);
  }
});*/

app.action('submit_query_input', async ({ ack, body, client }) => {
  try {
    // Acknowledge the submit event
    await ack();
    console.log(JSON.stringify(body));
    const inputKey = Object.keys(body.view.state.values).find(key => {
      return body.view.state.values[key].text_input !== undefined;
    });
  
    // Check if an input key was found
    if (!inputKey) {
      throw new Error('No input key found in view state');
    }
  
    // Retrieve the value of the text input
    const { value } = body.view.state.values[inputKey].text_input;
    var messages = [ ];

      // Log the user's input to the console
      messages.push({"role": "system", "content": 'Help write or explain salesforce SOQL queries'});
      messages.push({"role": "user", "content": value});
  
      const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });  
      // Update the app home with the submitted message
      await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'input',
            element: {
              type: 'plain_text_input',
              multiline: true,
              action_id: 'text_input',
            },
            label: {
              type: 'plain_text',
              text: 'Paste in a SOQL query or ask how to write one!',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Submit',
                },
                action_id: 'submit_query_input',
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Query: ${value}*`,
          },
        },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Answer:*\n${result.data.choices[0].message.content}`,
          },
        },
        ],
      },
    });
} catch (error) {
  console.error(error);
  }
});

app.action('submit_error_input', async ({ ack, body, client }) => {
  try {
    // Acknowledge the submit event
    await ack();
    console.log(JSON.stringify(body));
    const inputKey = Object.keys(body.view.state.values).find(key => {
      return body.view.state.values[key].text_input !== undefined;
    });
  
    // Check if an input key was found
    if (!inputKey) {
      throw new Error('No input key found in view state');
    }
  
    // Retrieve the value of the text input
    const { value } = body.view.state.values[inputKey].text_input;
    var messages = [ ];

      // Log the user's input to the console
      messages.push({"role": "system", "content": 'Help explain this Salesforce related error'});
      messages.push({"role": "user", "content": value});
  
      const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });  
      // Update the app home with the submitted message
      await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'input',
            element: {
              type: 'plain_text_input',
              multiline: true,
              action_id: 'text_input',
            },
            label: {
              type: 'plain_text',
              text: 'Paste in a Salesforce related error!',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Submit',
                },
                action_id: 'submit_error_input',
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Query: ${value}*`,
          },
        },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Answer:*\n${result.data.choices[0].message.content}`,
          },
        },
        ],
      },
    });
} catch (error) {
  console.error(error);
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

module.exports.handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));
    console.log(JSON.stringify(callback));

    return handler(event, context, callback);
}
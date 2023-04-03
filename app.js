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



(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

module.exports.handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
}
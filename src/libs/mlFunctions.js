import childProcess from 'child_process'

const mlFunctions = () => {
  return {
    askOllama: async function askOllama( question ) {
      console.log(`askOllama question:${question}`)
      // Use the Ollama CLI to ask the question
      const ollamaCommand = 'ollama-cli';
      const args = [ 'ask', question ];

      childProcess.execFile( ollamaCommand, args, ( error, stdout, stderr ) => {
        if ( error ) {
          console.error( `Error: ${ error }` );
          return;
        }

        // Print the answer
        console.log( stdout.trim() );
      } );
    }
  }
}

export default mlFunctions;

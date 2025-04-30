import Storage from 'node-storage';
import { dirname } from 'path';
import { writeFileSync, readFileSync } from 'fs';

const webDirectory = process.env.WEBDIRECTORY;

const chatDataFileName = "./data/" + process.env.CHATDATA;
const aliasDataFileName = "./data/" + process.env.ALIASDATA;
const chatDocWebPageName = process.env.CHATDOC;
const chatDocOutputFile = webDirectory + chatDocWebPageName;

const themesDataFilename = process.env.THEMESDATA;
const themeDocWebPageName = process.env.THEMESDOC;
const themesDocOutputFile = webDirectory + themeDocWebPageName;

import * as fs from 'fs';

const documentationFunctions = () => {

  return {

//     rebuildChatDocumentation: function () {
//       // Write the initial HTML structure
//       fs.writeFileSync(chatDocOutputFile, `
// <html>
// <head>
//   <style type="text/css">
//     .tg  {border-collapse:collapse;border-spacing:0;}
//     .tg td, .tg th {
//       border-color:black;border-style:solid;border-width:1px;
//       font-family:Arial, sans-serif;font-size:14px;
//       overflow:hidden;padding:10px 5px;word-break:normal;
//       text-align:left;vertical-align:top;
//     }
//     .tg .tg-eidr {
//       background-color:#ffffff;position:sticky;top:-1px;
//       will-change:transform
//     }
//     .image-container {
//       display: none;
//       margin-top: 10px;
//     }
//     .image-container img {
//       margin-right: 5px;
//       margin-top: 5px;
//     }
//   </style>
// </head>
// <body>
// <table id="tg-0zToJ" class="tg">
//   <thead>
//     <tr>
//       <th class="tg-eidr">Command</th>
//       <th class="tg-eidr">Messages</th>
//       <th class="tg-eidr">Images</th>
//     </tr>
//   </thead>
//   <tbody>
// `);
//
//       // Read and parse the JSON data
//       fs.readFile(chatDataFileName, function (err, data) {
//         if (err) {
//           console.error("Error reading data file:", err);
//           return;
//         }
//
//         const jsonParsed = JSON.parse(data);
//         const theCommands = Object.keys(jsonParsed.chatMessages);
//
//         theCommands.forEach((key, index) => {
//           const theMessages = jsonParsed.chatMessages[key].messages;
//           const thePictures = jsonParsed.chatMessages[key].pictures || [];
//           const imageContainerId = `img-container-${index}`;
//           const buttonId = `btn-${index}`;
//           const imageData = JSON.stringify(thePictures).replace(/"/g, '&quot;');
//
//           // Write the row
//           fs.writeFileSync(chatDocOutputFile, `
//   <tr>
//     <td class="tg-0lax">${key}</td>
//     <td class="tg-0lax"><ul>${theMessages.map(m => `<li>${m}</li>`).join('')}</ul></td>
//     <td class="tg-0lax">
//       <button id="${buttonId}" onclick="toggleImages('${imageContainerId}', '${buttonId}', JSON.parse(this.dataset.images))"
//         data-images="${imageData}">Show Images</button>
//       <div id="${imageContainerId}" class="image-container"></div>
//     </td>
//   </tr>
// `, { flag: 'a+' });
//         });
//
//         // Finalize the HTML with closing tags and JS
//         fs.writeFileSync(chatDocOutputFile, `
//   </tbody>
// </table>
//
// <script>
//   function toggleImages(containerId, buttonId, imageList) {
//     const container = document.getElementById(containerId);
//     const button = document.getElementById(buttonId);
//
//     if (!container || !button) return;
//
//     if (container.style.display === "none" || container.style.display === "") {
//       // Show and load images if not already loaded
//       container.style.display = "block";
//       button.innerText = "Hide Images";
//
//       if (container.dataset.loaded !== "true") {
//         imageList.forEach(src => {
//           const img = document.createElement("img");
//           img.src = src;
//           img.width = 100;
//           img.loading = "lazy";
//           container.appendChild(img);
//         });
//         container.dataset.loaded = "true";
//       }
//     } else {
//       // Hide
//       container.style.display = "none";
//       button.innerText = "Show Images";
//     }
//   }
// </script>
//
// </body>
// </html>
// `, { flag: 'a+' });
//       });
//     },

    rebuildChatDocumentation: function () {
      // Step 1: Read alias data
      let commandToAliasesMap = {};
      try {
        const aliasData = JSON.parse(fs.readFileSync(aliasDataFileName, 'utf-8'));
        const aliases = aliasData.commands || {};

        // Build a mapping of command -> aliases
        Object.keys(aliases).forEach(cmd => {
          commandToAliasesMap[cmd] = aliases[cmd];
        });
      } catch (e) {
        console.error("Error reading alias file:", e);
      }

      // Step 2: Write initial HTML
      fs.writeFileSync(chatDocOutputFile, `
<html>
<head>
  <style type="text/css">
    .tg  {border-collapse:collapse;border-spacing:0;}
    .tg td, .tg th {
      border-color:black;border-style:solid;border-width:1px;
      font-family:Arial, sans-serif;font-size:14px;
      overflow:hidden;padding:10px 5px;word-break:normal;
      text-align:left;vertical-align:top;
    }
    .tg .tg-eidr {
      background-color:#ffffff;position:sticky;top:-1px;
      will-change:transform
    }
    .image-container {
      display: none;
      margin-top: 10px;
    }
    .image-container img {
      margin-right: 5px;
      margin-top: 5px;
    }
  </style>
</head>
<body>
<table id="tg-0zToJ" class="tg">
  <thead>
    <tr>
      <th class="tg-eidr">Command</th>
      <th class="tg-eidr">Aliases</th>
      <th class="tg-eidr">Messages</th>
      <th class="tg-eidr">Images</th>
    </tr>
  </thead>
  <tbody>
`);

      // Step 3: Read and parse the chat JSON data
      fs.readFile(chatDataFileName, function (err, data) {
        if (err) {
          console.error("Error reading data file:", err);
          return;
        }

        const jsonParsed = JSON.parse(data);
        // const theCommands = Object.keys(jsonParsed.chatMessages);
        const theCommands = Object.keys(jsonParsed.chatMessages).sort((a, b) => a.localeCompare(b));


        theCommands.forEach((key, index) => {
          const theMessages = jsonParsed.chatMessages[key].messages;
          const thePictures = jsonParsed.chatMessages[key].pictures || [];
          const imageContainerId = `img-container-${index}`;
          const buttonId = `btn-${index}`;
          const imageData = JSON.stringify(thePictures).replace(/"/g, '&quot;');

          // Get aliases for this command (or empty array)
          const aliases = commandToAliasesMap[key] || [];

          fs.writeFileSync(chatDocOutputFile, `
  <tr>
    <td class="tg-0lax">${key}</td>
    <td class="tg-0lax">${aliases.join(', ')}</td>
    <td class="tg-0lax"><ul>${theMessages.map(m => `<li>${m}</li>`).join('')}</ul></td>
    <td class="tg-0lax">
      <button id="${buttonId}" onclick="toggleImages('${imageContainerId}', '${buttonId}', JSON.parse(this.dataset.images))"
        data-images="${imageData}">Show Images</button>
      <div id="${imageContainerId}" class="image-container"></div>
    </td>
  </tr>
`, { flag: 'a+' });
        });

        // Step 4: Finalize HTML
        fs.writeFileSync(chatDocOutputFile, `
  </tbody>
</table>

<script>
  function toggleImages(containerId, buttonId, imageList) {
    const container = document.getElementById(containerId);
    const button = document.getElementById(buttonId);

    if (!container || !button) return;

    if (container.style.display === "none" || container.style.display === "") {
      container.style.display = "block";
      button.innerText = "Hide Images";

      if (container.dataset.loaded !== "true") {
        imageList.forEach(src => {
          const img = document.createElement("img");
          img.src = src;
          img.width = 100;
          img.loading = "lazy";
          container.appendChild(img);
        });
        container.dataset.loaded = "true";
      }
    } else {
      container.style.display = "none";
      button.innerText = "Show Images";
    }
  }
</script>

</body>
</html>
`, { flag: 'a+' });
      });
    },
    
    rebuildThemesDocumentation: function ( theThemes ) {
      fs.writeFileSync( themesDocOutputFile, "<html><body>The Theme Randomizer currently contains the following" +
        " themes!!<p><ul>\n" );

      for ( let themeLoop of theThemes ) {
        fs.writeFileSync( themesDocOutputFile, "<li>" + themeLoop + "</li>\n", { flag: 'a+' } );
      }

      fs.writeFileSync( themesDocOutputFile, "</ul></body></html>", { flag: 'a+' } );

    }
  }

}

export default documentationFunctions;
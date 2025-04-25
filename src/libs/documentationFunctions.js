import Storage from 'node-storage';
import { dirname } from 'path';
import { writeFileSync, readFileSync } from 'fs';

const webDirectory = process.env.WEBDIRECTORY;

const chatDataFileName = "./data/" + process.env.CHATDATA;
const chatDocWebPageName = process.env.CHATDOC;
const chatDocOutputFile = webDirectory + chatDocWebPageName;

const themesDataFilename = process.env.THEMESDATA;
const themeDocWebPageName = process.env.THEMESDOC;
const themesDocOutputFile = webDirectory + themeDocWebPageName;

import * as fs from 'fs';

const documentationFunctions = () => {

  return {
    // rebuildChatDocumentation: function () {
    //
    //   fs.writeFileSync( chatDocOutputFile, "<html><body><style type=\"text/css\">\n" +
    //     ".tg  {border-collapse:collapse;border-spacing:0;}\n" +
    //     ".tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;\n" +
    //     "  overflow:hidden;padding:10px 5px;word-break:normal;}\n" +
    //     ".tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;\n" +
    //     "  font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}\n" +
    //     ".tg .tg-eidr{background-color:#ffffff;position:-webkit-sticky;position:sticky;text-align:left;top:-1px;vertical-align:top;\n" +
    //     "  will-change:transform}\n" +
    //     ".tg .tg-0lax{text-align:left;vertical-align:top}\n" +
    //     ".tg-sort-header::-moz-selection{background:0 0}\n" +
    //     ".tg-sort-header::selection{background:0 0}.tg-sort-header{cursor:pointer}\n" +
    //     ".tg-sort-header:after{content:'';float:right;margin-top:7px;border-width:0 5px 5px;border-style:solid;\n" +
    //     "  border-color:#404040 transparent;visibility:hidden}\n" +
    //     ".tg-sort-header:hover:after{visibility:visible}\n" +
    //     ".tg-sort-asc:after,.tg-sort-asc:hover:after,.tg-sort-desc:after{visibility:visible;opacity:.4}\n" +
    //     ".tg-sort-desc:after{border-bottom:none;border-width:5px 5px 0}</style>\n" +
    //     "<table id=\"tg-0zToJ\" class=\"tg\">\n" +
    //     "<thead>\n" +
    //     "  <tr>\n" +
    //     "    <th class=\"tg-eidr\">Command</th>\n" +
    //     "    <th class=\"tg-eidr\">Messages</th>\n" +
    //     "    <th class=\"tg-eidr\">Images</th>\n" +
    //     "  </tr>\n" +
    //     "</thead>\n" +
    //     "<tbody>" );
    //
    //   fs.readFile( chatDataFileName,
    //     // callback function that is called when reading file is done
    //     function ( err, data ) {
    //       // json data
    //       let jsonData = data;
    //
    //       // parse json
    //       let jsonParsed = JSON.parse( jsonData );
    //
    //       const theCommands = Object.keys( jsonParsed.chatMessages );
    //
    //       let theMessages;
    //       let thePictures;
    //
    //       theCommands.forEach( ( key, index ) => {
    //         theMessages = jsonParsed.chatMessages[ key ].messages;
    //         thePictures = jsonParsed.chatMessages[ key ].pictures;
    //         // console.log( key );
    //         // write the command to the table
    //         fs.writeFileSync( chatDocOutputFile, "<tr>\n" + "<td class=\"tg-0lax\">" + key + "</td>", { flag: 'a+' } );
    //
    //         // write the messages in an unordered list
    //         fs.writeFileSync( chatDocOutputFile, "<td class=\"tg-0lax\"><ul>", { flag: 'a+' } );
    //         theMessages.forEach( ( key, index ) => {
    //           // console.log( key );
    //           fs.writeFileSync( chatDocOutputFile, "<li>" + key, { flag: 'a+' } );
    //         } );
    //         fs.writeFileSync( chatDocOutputFile, "</ul></td>", { flag: 'a+' } );
    //
    //         // write the pictures as 100 wide images in an unordered list
    //         // console.log( thePictures );
    //         fs.writeFileSync( chatDocOutputFile, "<td class=\"tg-0lax\">", { flag: 'a+' } );
    //         if ( thePictures !== undefined ) {
    //           thePictures.forEach( ( key, index ) => {
    //             // console.log( key );
    //             fs.writeFileSync( chatDocOutputFile, "<img src=\"" + key + "\" width=\"100\"> ", { flag: 'a+' } );
    //           } );
    //         }
    //         fs.writeFileSync( chatDocOutputFile, "</td>", { flag: 'a+' } );
    //
    //         fs.writeFileSync( chatDocOutputFile, "</tr>", { flag: 'a+' } );
    //       } );
    //
    //       fs.writeFileSync( chatDocOutputFile, "</tbody>\n" +
    //         "</table>\n" +
    //         "<script charset=\"utf-8\">var TGSort=window.TGSort||function(n){\"use strict\";function r(n){return n?n.length:0}function t(n,t,e,o=0){for(e=r(n);o<e;++o)t(n[o],o)}function e(n){return n.split(\"\").reverse().join(\"\")}function o(n){var e=n[0];return t(n,function(n){for(;!n.startsWith(e);)e=e.substring(0,r(e)-1)}),r(e)}function u(n,r,e=[]){return t(n,function(n){r(n)&&e.push(n)}),e}var a=parseFloat;function i(n,r){return function(t){var e=\"\";return t.replace(n,function(n,t,o){return e=t.replace(r,\"\")+\".\"+(o||\"\").substring(1)}),a(e)}}var s=i(/^(?:\\s*)([+-]?(?:\\d+)(?:,\\d{3})*)(\\.\\d*)?$/g,/,/g),c=i(/^(?:\\s*)([+-]?(?:\\d+)(?:\\.\\d{3})*)(,\\d*)?$/g,/\\./g);function f(n){var t=a(n);return!isNaN(t)&&r(\"\"+t)+1>=r(n)?t:NaN}function d(n){var e=[],o=n;return t([f,s,c],function(u){var a=[],i=[];t(n,function(n,r){r=u(n),a.push(r),r||i.push(n)}),r(i)<r(o)&&(o=i,e=a)}),r(u(o,function(n){return n==o[0]}))==r(o)?e:[]}function v(n){if(\"TABLE\"==n.nodeName){for(var a=function(r){var e,o,u=[],a=[];return function n(r,e){e(r),t(r.childNodes,function(r){n(r,e)})}(n,function(n){\"TR\"==(o=n.nodeName)?(e=[],u.push(e),a.push(n)):\"TD\"!=o&&\"TH\"!=o||e.push(n)}),[u,a]}(),i=a[0],s=a[1],c=r(i),f=c>1&&r(i[0])<r(i[1])?1:0,v=f+1,p=i[f],h=r(p),l=[],g=[],N=[],m=v;m<c;++m){for(var T=0;T<h;++T){r(g)<h&&g.push([]);var C=i[m][T],L=C.textContent||C.innerText||\"\";g[T].push(L.trim())}N.push(m-v)}t(p,function(n,t){l[t]=0;var a=n.classList;a.add(\"tg-sort-header\"),n.addEventListener(\"click\",function(){var n=l[t];!function(){for(var n=0;n<h;++n){var r=p[n].classList;r.remove(\"tg-sort-asc\"),r.remove(\"tg-sort-desc\"),l[n]=0}}(),(n=1==n?-1:+!n)&&a.add(n>0?\"tg-sort-asc\":\"tg-sort-desc\"),l[t]=n;var i,f=g[t],m=function(r,t){return n*f[r].localeCompare(f[t])||n*(r-t)},T=function(n){var t=d(n);if(!r(t)){var u=o(n),a=o(n.map(e));t=d(n.map(function(n){return n.substring(u,r(n)-a)}))}return t}(f);(r(T)||r(T=r(u(i=f.map(Date.parse),isNaN))?[]:i))&&(m=function(r,t){var e=T[r],o=T[t],u=isNaN(e),a=isNaN(o);return u&&a?0:u?-n:a?n:e>o?n:e<o?-n:n*(r-t)});var C,L=N.slice();L.sort(m);for(var E=v;E<c;++E)(C=s[E].parentNode).removeChild(s[E]);for(E=v;E<c;++E)C.appendChild(s[v+L[E-v]])})})}}n.addEventListener(\"DOMContentLoaded\",function(){for(var t=n.getElementsByClassName(\"tg\"),e=0;e<r(t);++e)try{v(t[e])}catch(n){}})}(document)</script></body></html>"
    //         , { flag: 'a+' } );
    //
    //     } );
    // },
    rebuildChatDocumentation: function () {
      // Write the initial HTML structure
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
      <th class="tg-eidr">Messages</th>
      <th class="tg-eidr">Images</th>
    </tr>
  </thead>
  <tbody>
`);

      // Read and parse the JSON data
      fs.readFile(chatDataFileName, function (err, data) {
        if (err) {
          console.error("Error reading data file:", err);
          return;
        }

        const jsonParsed = JSON.parse(data);
        const theCommands = Object.keys(jsonParsed.chatMessages);

        theCommands.forEach((key, index) => {
          const theMessages = jsonParsed.chatMessages[key].messages;
          const thePictures = jsonParsed.chatMessages[key].pictures || [];
          const imageContainerId = `img-container-${index}`;
          const buttonId = `btn-${index}`;
          const imageData = JSON.stringify(thePictures).replace(/"/g, '&quot;');

          // Write the row
          fs.writeFileSync(chatDocOutputFile, `
  <tr>
    <td class="tg-0lax">${key}</td>
    <td class="tg-0lax"><ul>${theMessages.map(m => `<li>${m}</li>`).join('')}</ul></td>
    <td class="tg-0lax">
      <button id="${buttonId}" onclick="toggleImages('${imageContainerId}', '${buttonId}', JSON.parse(this.dataset.images))"
        data-images="${imageData}">Show Images</button>
      <div id="${imageContainerId}" class="image-container"></div>
    </td>
  </tr>
`, { flag: 'a+' });
        });

        // Finalize the HTML with closing tags and JS
        fs.writeFileSync(chatDocOutputFile, `
  </tbody>
</table>

<script>
  function toggleImages(containerId, buttonId, imageList) {
    const container = document.getElementById(containerId);
    const button = document.getElementById(buttonId);

    if (!container || !button) return;

    if (container.style.display === "none" || container.style.display === "") {
      // Show and load images if not already loaded
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
      // Hide
      container.style.display = "none";
      button.innerText = "Show Images";
    }
  }
</script>

</body>
</html>
`, { flag: 'a+' });
      });
    }

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
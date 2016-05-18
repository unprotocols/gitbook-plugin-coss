var fs = require('fs');
var glob = require('glob');

module.exports = {
    // Map of hooks
    hooks: {
      "page:before": function(page) {
        if (page.title.match(/^\d+\/.+/) !== null) {
          // Update title
          page.content = "# " + page.title + "\n" + page.content;
        }
        return page;
      },
      "page": function(page) {
        if (page.title.match(/^\d+\/.+/) !== null) {
          // save a spec: copy
          var n = page.title.split('/')[0]
          var name = page.title.split('/')[1]
          fs.mkdirSync("_book/spec:" + n)
          fs.mkdirSync("_book/spec:" + n + "/" + name)
          fs.writeFileSync("_book/spec:" + n + "/index.html", page.content)
          fs.writeFileSync("_book/spec:" + n + "/" + name + "/index.html", page.content)
        }
        return page;
      },
      "finish:before": function() {
        var mainFiles = glob.sync("_book/**/index.html");
        mainFiles.map(function(file) {
          fs.writeFileSync(file, fs.readFileSync(file).toString().replace(/href="([\.\/]*)(\d+)\/"/g,"href=\"./$1spec:$2\""));
        });
        var files = glob.sync("_book/spec:*/**/index.html");
        files.map(function(file) {
          var content = fs.readFileSync("_book/" + file.match(/spec:\d+/)[0].split(':')[1] + "/index.html").toString();
          if (file.match(/spec:\d+\/.+\/index\.html/) != null) {
            content = content.replace(/\.\.\/gitbook/g,"../../gitbook")
            content = content.replace(/a href="\.\/\.\.\//g,"a href=\"../../")
          }
          fs.writeFileSync(file, content);
        });
      }
    },

    // Map of new blocks
    blocks: {},

    // Map of new filters
    filters: {}
};

var fs = require('fs');
var glob = require('glob');

var shortnames = {}

module.exports = {
    // Map of hooks
    hooks: {
      "page:before": function(page) {
        var title = page.shortname || page.title;

        var name = page.name ? "\n ## " + page.name : "";
        var insert = "";

        if (!page.noinsert && page.status) {
          insert += "![" + page.status + "](http://rfc.unprotocols.org/spec:2/COSS/" + page.status + ".svg)\n"
        }

        if (!page.noinsert && page.domain) {
          insert += "* Name: [" + page.domain + "/spec:" + page.shortname + "](http://" + page.domain + "/spec:" + page.shortname + ")\n";
          insert += "* Status: " + page.status + "\n";
          insert += "* Editor: " + page.editor + "\n";
          if (page.contributors) {
            insert += "* Contributors: " + (page.contributors || []).join(', ') + "\n";
          }
          insert += "\n";
        }

        if (title.match(/^\d+\/.+/) !== null) {
          shortnames[title.split("/")[0]] = title;
          // Update title
          page.content = "# " + title + name + "\n" + insert + page.content;
        }
        return page;
      },
      "page": function(page) {
        if (page.title.match(/^\d+\/.+/) !== null) {
          // save a spec: copy
          var n = page.title.split('/')[0]
          var name = page.title.split('/')[1]
          try {
            fs.mkdirSync("_book/spec:" + n);
          } catch (e) {
          }
          try {
            fs.mkdirSync("_book/spec:" + n + "/" + name);
          } catch (e) {
          }
          fs.writeFileSync("_book/spec:" + n + "/index.html", page.content)
          fs.writeFileSync("_book/spec:" + n + "/" + name + "/index.html", page.content)
          var files = glob.sync(n + "/**");
          files.map(function(file) {
            if (file.match(/README\.md$/) == null && fs.lstatSync(file).isFile()) {
              var content = fs.readFileSync(file);
              fs.writeFileSync("_book/spec:" + file, content);
              fs.writeFileSync("_book/spec:" + file.replace(new RegExp("^" + n), n + "/" + name), content);
            }
          });
        }
        return page;
      },
      "finish:before": function() {
        var mainFiles = glob.sync("_book/**/index.html");
        mainFiles.map(function(file) {
          fs.writeFileSync(file, fs.readFileSync(file).toString().replace(/href="([\.\/]*)(\d+)\/"/g,
             function(m, p1, p2) {
               return "href=\"./" + p1 + "spec:" + shortnames[p2] + "\""
             }));
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

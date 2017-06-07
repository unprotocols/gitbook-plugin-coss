var fs = require('fs');
var glob = require('glob');

var STATUS = [null, 'raw', 'draft', 'stable', 'deprecated', 'retired']

var shortnames = {}
var status = {}
var pointers = {}

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
          var n = title.split("/")[0];
          var sn = title.split("/")[1];
          shortnames[n] = title;
          // Update title
          page.content = "# " + title + name + "\n" + insert + page.content;
          if (page.status) {
            if ((STATUS.indexOf(status[sn]) <= STATUS.indexOf(page.status) && status[sn] != 'stable') ||
                (page.status == 'stable' && n > pointers[sn]) ||
                (typeof status[sn] === 'undefined')) {
                   status[sn] = page.status
                   pointers[sn] = n
            }
          }
        }
        return page;
      },
      "page": function(page) {
        if (page.title.match(/^\d+\/.+/) !== null) {
          // save a spec: copy
          var n = page.title.split('/')[0]
          var name = shortnames[n].split('/')[1]
          try {
            fs.mkdirSync("_book/" + name);
          } catch (e) {
          }
          try {
            fs.mkdirSync("_book/spec:" + n);
          } catch (e) {
          }
          try {
            fs.mkdirSync("_book/spec:" + n + "/" + name);
          } catch (e) {
          }
          var redirect = '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=../spec:' + n + '/' + name + '/"><title></title></head></html>'
          fs.writeFileSync("_book/spec:" + n + "/index.html", redirect)
          var redirectName = '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=../spec:' + pointers[name] + '/' + name + '/"><title></title></head></html>'
          fs.writeFileSync("_book/" + name + "/index.html", redirectName)
          fs.writeFileSync("_book/spec:" + n + "/" + name + "/index.html", page.content)
          var files = glob.sync(n + "/**");
          files.map(function(file) {
            if (file.match(/README\.md$/) == null && fs.lstatSync(file).isFile()) {
              var content = fs.readFileSync(file);
              fs.writeFileSync("_book/spec:" + file.replace(new RegExp("^" + n), n + "/" + name), content);
            }
          });
        }
        return page;
      },
      // this function fixes relative links, since the real index.html file is now located under "./spec:NN/NAME/index.html,
      // which is "one-level-deeper" than the original one created by gitbook, where it was under "./NN/index.html"
      // this replacement consists of two steps: first all links NN are replaced by spec:NN/NAME and then all relative paths are extended by one level
      "finish:before": function() {
        var mainFiles = glob.sync("_book/**/index.html");
        // this replaces links to the RFCs with the new "spec:NN/NAME" link: "./../1/"  -->  "./../spec:1/NAME"
        mainFiles.map(function(file) {
          fs.writeFileSync(file, fs.readFileSync(file).toString().replace(/href="([\.\/]*)(\d+)\/"/g,
             function(m, p1, p2) {
               return "href=\"./" + p1 + "spec:" + shortnames[p2] + "/\""
             }));
        });
        var files = glob.sync("_book/spec:*/?**/*.html");
        // this function corrects relative paths, as now every content is one level deeper
        files.map(function(file) {
          var content = fs.readFileSync("_book/" + file.match(/spec:\d+/)[0].split(':')[1] + "/index.html").toString();
          if (file.match(/spec:\d+\/.+\/index\.html/) != null) {
            // this replaces all gitbook resource links: "../gitbook" --> "../../gitbook"
            content = content.replace(/\.\.\/gitbook/g,"./../../gitbook")
            content = content.replace(/\.\.\/styles/g,"./../../styles")
            // this replaces "one-level-up" links: "./../"  -->  "../../" AND "../"  -->  "../../"
            content = content.replace(/a href="(\.\/)?\.\.\//g,"a href=\"./../../")
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

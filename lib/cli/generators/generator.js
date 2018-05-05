var ejs = require('ejs'),
people = ['geddy', 'neil', 'alex'],
html = ejs.render('<%= people.join(", "); %>', {people: people});
console.log(html);
options = null;
str = '<% if (user) { %><h2><%= user.name %></h2><% } %>'
str = '<% for (var i=0;i<user.length;i++) { %><h2><%= user[i].name %></h2><br/><% } %>'
data = {user:[{name:"nameA"},{name:"nameB"}]}

var template = ejs.compile(str, options);
rs = template(data);
console.log(rs);
// => 输出绘制后的 HTML 字符串

// ejs.render(str, data, options);
// // => 输出绘制后的 HTML 字符串

// ejs.renderFile(filename, data, options, function(err, str){
//     // str => 输出绘制后的 HTML 字符串
// });

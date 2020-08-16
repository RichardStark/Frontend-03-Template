# 重学JavaScript05——浏览器

URL 变成屏幕上的网页是怎样一个过程呢：

1. 浏览器首先使用HTTP/HTTPS协议，向服务端请求页面
2. 请求回来的HTML代码经过解析，构建成DOM树
3. 计算DOM树上的CSS属性
4. 最后根据CSS属性对元素逐个进行渲染，得到内存中的位图
5. （对位图进行合成，增加后续绘制的速度）
6. 合成之后，绘制到界面上

![6391573a276c47a9a50ae0cbd2c5844c](https://tva1.sinaimg.cn/large/007S8ZIlly1ghnohw801lj31400miacn.jpg)从HTTP请求回来开始，整个过程就是条流水线，而非做完一步再做下一步。

既然是流水线，也就是说从HTTP请求回来，就产生了流式数据，后续的DOM构建、CSS计算、渲染、合成、绘制，都是尽可能地流式处理前一步产出，也就是说，**不需要等到上一步完全结束**，就开始处理上一步的输出，这样我们才能看到逐渐渲染的页面。



## HTTP协议

浏览器首先要根据URL，把数据取回来，使用的就是HTTP协议（当然还有DNS查询）。

与HTTP相关的标准有两份：

- HTTP1.1 https://tools.ietf.org/html/rfc2616
- HTTP1.1 https://tools.ietf.org/html/rfc7234

HTTP协议是基于TCP协议出现的，对于TCP协议来说，是一条双向的通讯通道，HTTP在TCP基础上，规定了Request-Response模式，**这个模式决定了通讯必定是由浏览器首先发起**。

通常，浏览器实现者只需要用一个TCP库，甚至现成的HTTP库就可以搞定浏览器的网络通讯部分。

HTTP是纯粹的文本协议，规定了使用TCP协议来传输文本格式，是一个应用层协议。

### 实验

我们可以试着用纯粹的TCP客户端来实现HTTP：

```
// 连接到极客时间主机
telnet time.geekbang.org 80
Trying 47.93.95.233...
Connected to zabg4torzijx7ew8ilcoe9rdmxi6lnn5.yundunwaf4.com.
Escape character is '^]'.

// 输入以下字符作为请求
GET / HTTP/1.1
Host: time.geekbang.org


// 两次回车后收到请求
HTTP/1.1 301 Moved Permanently
Server: Tengine
Date: Tue, 11 Aug 2020 23:47:54 GMT
Content-Type: text/html
Content-Length: 278
Connection: keep-alive
Location: https://time.geekbang.org/

<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html>
<head><title>301 Moved Permanently</title></head>
<body bgcolor="white">
<h1>301 Moved Permanently</h1>
<p>The requested resource has been assigned a new permanent URI.</p>
<hr/>Powered by Tengine</body>
</html>

```

以上是一次完整的HTTP请求，可见在tcp通道传输中，完全是文本。

GET / HTTP/1.1 是request line ， 包含了请求方法GET， 请求路径/ ， 请求协议和版本HTTP/1.1

request line 后面 跟随着请求头。 以一个空行（两个换行符分隔），紧跟请求体。

HTTP/1.1 301 Moved Permanently 是response line， 包含了协议和版本HTTP/1.1， 状态码 301 和状态文本 Moved Permanently

response line 后面跟随着响应头。以一个空行（两个换行符分隔），紧跟响应体。



### HTTP格式

综上，HTTP协议，大概分为以下几部分：

![3db5e0f362bc276b83c7564430ecb0a1](https://static001.geekbang.org/resource/image/3d/a1/3db5e0f362bc276b83c7564430ecb0a1.jpg)

其中path是请求的路径，完全由服务端定义，没什么特别；version几乎都是固定字符串；response body 是我们熟悉的HTML。我们来讲讲剩下的。

#### HTTP Method （方法）

方法有以下几种：

- GET，常见的访问
- POST，常见的表单提交
- HEAD，与GET类似，只返回请求头，多数由JS发起
- PUT，添加资源，语义约定没有强约束
- DELETE，删除资源，语义约定没有强约束
- CONNECT，多用于HTTPS和WebSocket
- OPTIONS，用于调试，多数线上服务不支持
- TRACE，用于调试，多数线上服务不支持

#### HTTP Status code状态码和 HTTP Status text状态文本

常见的状态码和状态文本有：

- 1xx：临时回应，表示客户端请继续
- 2xx：表示请求成功
  - 200:请求成功
- 3xx：表示请求目标有变化，希望客户端进一步处理
  - 301&302 永久性与临时性跳转，**301更接近一种报错，提示客户端别来了**
  - 304 与客户端缓存一致，服务端没有更新
- 4xx：客户端请求错误
  - 401 未授权
  - 403 无权限
  - 404 请求页面不存在
  - 418 Its a teapot 这是一个彩蛋，来自ietf的一个[愚人节玩笑](https://tools.ietf.org/html/rfc2324)
- 5xx：服务端请求错误
  - 500 服务端错误
  - 503 服务端暂时性错误，可以一会儿再试

#### HTTP Head（HTTP 头）

HTTP头可以看作一个键值对。

HTTP头也是一种数据，我们可以自定义它的头和值，不过在HTTP规范中规定了一些特殊的HTTP头，写在了标准中，我们挑几个重点。

##### Request Header

![2be3e2457f08bdf624837dfaee01e4a2](https://static001.geekbang.org/resource/image/2b/a2/2be3e2457f08bdf624837dfaee01e4a2.png)

##### Response Header

![efdeadf27313e08bf0789a3b5480f7c9](https://static001.geekbang.org/resource/image/ef/c9/efdeadf27313e08bf0789a3b5480f7c9.png)

这些头是我们不应该查阅，放到脑子里的，看到就知道的HTTP头，完整的可以参考rfc2616标准。



#### HTTP Request Body

HTTP请求的body 主要用于提交表单的场景。

HTTP的请求body 比较自由，只要浏览器发送body服务端认可即可，一些常见的body格式是：

- application/json
- application/x-www-form-urlencoded
- multipart/form-data
- text/xml

我们使用HTML的form 标签提交产生的HTML请求，会默认产生application/x-www-form-urlencoded数据格式，当有文件上传时，则会使用multipart/form-data



#### HTTPS

HTTPS和HTTP2 在HTTP的基础上规定了更复杂的内容，但仍保留了Request-Response 模式。

HTTPS有两个作用：

- 确定请求的目标服务端身份
- 保证传输的数据不会被网络中间节点窃听或篡改

具体RFC标准见https://tools.ietf.org/html/rfc2818

HTTPS， 是使用加密通道来传输HTTP的内容，但HTTPS首先与服务端建立一条TLS加密通道，而TLS构建在TCP协议上，**它实际上是对传输的内容做一次加密**，所以从传输内容没有任何区别。



#### HTTP 2

HTTP2 是HTTP 1.1 的升级版本，RFC标准见：https://tools.ietf.org/html/rfc7540

HTTP2的改进有两点：

- 一是支持服务端推送
- 二是支持TCP连接的复用

服务端推送能够在客户端发送第一个请求到服务端时，提前把一部分内容推送给客户端放入缓存中，这样可以避免客户端请求顺序带来的并行度不高，从而导致的性能问题。

TCP连接复用，是使用同一个TCP连接来传输多个HTTP请求，避免了TCP建立连接时的三次握手开销，和初建TCP连接时，传输窗口小的问题。

注意：其实很多优化涉及到更底层的协议。IP层的分包情况，和物理层的建立时间是需要被考虑的。

## 状态机与DOM树构建

这一章主要解决两个问题：

- 如何解析请求回来的HTML代码
- DOM树是如何构建的

![34231687752c11173b7776ba5f4a0e5a](https://static001.geekbang.org/resource/image/34/5a/34231687752c11173b7776ba5f4a0e5a.png)

### 解析代码

我们现在来关注Response Body，Response Body 为 HTML， 而HTML我们日常开发用到的90%的词（token，指最小的有意义的单元），其种类大约只有标签开始、属性、标签结束、注释、CDATA节点这几种。

但要对SGML做不少容错处理，比如遇到了“<?”和“<%”，报错了也要静默处理。

#### token的拆分

来看一个十分标准的标签

```html
<p class="a">text text text</p>
```

我们可以拆分为：

- <p“标签开始”的开始；
- class=“a” 属性；
- \>  “标签开始”的结束；
- text text text 文本；
- </p> 标签结束。



![f98444aa3ea7471d2414dd7d0f5e3a84](https://tva1.sinaimg.cn/large/007S8ZIlly1gho3851gnsj30hc070gm0.jpg)

代码开始从HTTP协议收到的字符流读取协议，每读入一个字符，就要做一次决策，而且这些决定与“当前状态”有关，这种条件下，我们想要将字符流解析成token，最常见的方式就是状态机。

#### 状态机

绝大多数语言的词法部分都是用状态机实现的，我们把部分token解析成一个状态机：

![8b43d598bc1f83a8a1e7e8f922013ab0](https://static001.geekbang.org/resource/image/8b/b0/8b43d598bc1f83a8a1e7e8f922013ab0.png)

真正的HTML词法状态机要更复杂，可以参考[HTML 官方文档](https://html.spec.whatwg.org/multipage/parsing.html#tokenization)，里面规定了80个状态机（HTML是我见过的唯一一个标准中规定了状态机实现的语言，大部分语言来说，状态机是一种实现，而非定义）

简单描述一下状态机的运行步骤：

- 初始状态，我们仅仅区分 “< ”和 “非 <”：
  - 如果获得的是一个非 < 字符，那么可以认为进入了一个文本节点；
  - 如果获得的是一个 < 字符，那么进入一个标签状态。
    - 比如下一个字符是“ ! ” ，那么很可能是进入了注释节点或者 CDATA 节点。
    - 如果下一个字符是 “/ ”，那么可以确定进入了一个结束标签。
    - 如果下一个字符是字母，那么可以确定进入了一个开始标签。
    - 如果我们要完整处理各种 HTML 标准中定义的东西，那么还要考虑“ ? ”“% ”等内容。

**基于状态机的词法分析，本质上是把每个token 的“特征字符”拆成独立的状态，再把所有token的特征字符链合并，形成一个联通图。**

状态机属于编译原理的只是，这里先打住。

下面就是代码实现状态机了。C/C++ 和JavaScript 的实现大同小异：

- 每个函数当作一个状态
- 参数是接受的字符
- 返回值是下一个状态

（**不要试图封装状态机！永远不要！**）

图上的data状态大概如下：

```javascript
var data = function(c){
    if(c=="&") {
        return characterReferenceInData;
    }
    if(c=="<") {
        return tagOpen;
    }
    else if(c=="\0") {
        error();
        emitToken(c);
        return data;
    }
    else if(c==EOF) {
        emitToken(EOF);
        return data;
    }
    else {
        emitToken(c);
        return data;
    }
};
var tagOpenState = function tagOpenState(c){
    if(c=="/") {
        return endTagOpenState;
    }
    if(c.match(/[A-Z]/)) {
        token = new StartTagToken();
        token.name = c.toLowerCase();
        return tagNameState;
    }
    if(c.match(/[a-z]/)) {
        token = new StartTagToken();
        token.name = c;
        return tagNameState;
    }
    if(c=="?") {
        return bogusCommentState;
    }
    else {
        error();
        return dataState;
    }
};
//……
```

这段代码给出了状态机的两个状态示例，data为初始状态，tagOpenState是接受了一个< 字符，来判断标签类型的状态。

- 每一个状态是一个函数
- 通过 if else 来区分下一个字符做状态迁移

状态迁移，就是当前状态函数返回下一个状态函数。

```javascript
var state = data;
var char
while(char = getInput())
    state = state(char); // 通过state 来处理输入的字符流，这里用while循环是一个示例，真实场景可能来自TCP的输出流
```

- 状态函数通过代码中的emitToken函数来输出解析好的token，我们只需要覆盖emitToken，即可指定对解析结果的处理方式。

词法分析器接受字符的方式如下：

```javascript
function HTMLLexicalParser(){

    //状态函数们……
    function data() {
        // ……
    }

    function tagOpen() {
        // ……
    }
    // ……
    var state = data;
    this.receiveInput = function(char) {
        state = state(char);
    }
}
```

现在，我们就将字符流拆成token了。



### 构建DOM树

下面的任务是将token 变成DOM树，我们使用栈来实现。

```javascript
function HTMLSyntaticalParser(){
    var stack = [new HTMLDocument];
    this.receiveInput = function(token) {
        //……
    }
    this.getOutput = function(){
        return stack[0];
    }
}

```

- receiveInput 负责接收词法部分产生的词（token），通常可以由 emitToken 来调用
- 接收的同时，就开始构建DOM树，而构建DOM树的算法，写在receiveInput 中
- 当接收完所有的输入，栈顶就是最后的根节点

因此我们需要一个Node 类。

在完全符合标准的浏览器中，不一样的HTML节点对应了不同的Node 子类，我们简化一下，不展示继承体系，仅仅把Node 分为Element 和Text。

```javascript
function Element(){
    this.childNodes = [];
}
function Text(value){
    this.value = value || "";
}
```

我们的token中，tag start 和 tag end 需要成对匹配，而栈正式用于匹配的方案。

Text节点，需要我们把相邻的Text 节点合并。当token入栈时，检查栈顶是否是Text节点，如果是就合并。

```html
<html maaa=a >
    <head>
        <title>cool</title>
    </head>
    <body>
        <img src="a" />
    </body>
</html>
```

构建流程大致如下：

- 栈顶元素就是当前节点；
- 遇到属性，就添加到当前节点；
- 遇到文本节点，如果当前节点是文本节点，则跟文本节点合并，否则入栈成为当前节点的子节点；
- 遇到注释节点，作为当前节点的子节点；
- 遇到 tag start 就入栈一个节点，当前节点就是这个节点的父节点；
- 遇到 tag end 就出栈一个节点（还可以检查是否匹配）。

《原文有一个视频看一下，实现一下》

如果我们的HTML是严格的HTML，如完全遵守XHTML，问题不难，但是HTML如果具有容错能力，就是要处理end tag与 start tag 不匹配的问题，就十分复杂。

W3C将规则[整理好了](http://www.w3.org/html/wg/drafts/html/master/syntax.html#tree-construction)，我们只需要翻译成代码即可。

## 计算CSS

构建好了DOM，也只有节点和属性，不包含任何样式信息，浏览器如何把CSS规则应用到节点呢？也就是给光秃秃的DOM树添加上CSS属性。

### 整体过程

虽然叫CSS选择器，但并不是DOM树构建好之后，再进行选择并添加样式。

上面讲到了DOM树构建就是一个流式过程，也就是这个过程中，CSS属性被计算出来并添加上去的的。

整个过程中，我们依次拿出上一步构造好的元素，检查它匹配到了哪些规则，再根据规则的优先级，做覆盖和调整。因此“选择器”更好的叫法为“匹配器”。

CSS选择器的各种符号包括：

- 空格: 后代，选中它的子节点和所有子节点的后代节点。
- \>: 子代，选中它的子节点。
- +：直接后继选择器，选中它的下一个相邻节点。
- ~：后继，选中它之后所有的相邻节点。
- ||：列，选中表格中的一列。

选择器有一个特点，即选择器出现的顺序，必定根构建DOM树的顺序一致，这是CSS设计的原则，也就是说，再DOM树构建到当前节点时，已经能够准确判断是否匹配，不需要后续节点信息。

整体过程大概如下：

- 首先，把CSS规则做一下处理，CSS通过词法和语法分析，转换结构，属于编译原理内容，这里我们假设已经拿到了抽象语法树AST。
- CSS中一个compound-selector 是检查一个元素的规则，而数个compound-selector，通过前面的符号连起来，形成一个复合选择器。

### 后代选择器“空格”

```css
a#b .cls {
    width: 100px;
}
```

可以把compound-selector 拆开成多段，满足一段就前进一段。

如我们先找到匹配a#b的元素，才开始检查它所有的子代是否匹配.cls。

还要考虑后退的情况：

```html
<a id=b>
    <span>1<span>
    <span class=cls>2<span>
</a>
<span class=cls>3<span>
```

当遇到</a>时，必须让规则a#b .cls回退一步，这样第三个span才不会被选中。



### 后继选择器“～”

```html
.cls~* {
    border:solid 1px green;
}
<div>
<span>1<span>
<span class=cls>2<span>
<span>
    3
    <span>4</span>
<span>
<span>5</span>
</div>
```



后继选择器只作用于一层，.cls 选中了span2 ，span3 是它的后继，但span3 的子节点span4 并不应该被选中，但span5 也是后继，应当选中。

也就是说如果按照DOM树的构造顺序，4 在3 和5中间，我们没法像前面的后代选择器一样通过激活或关闭规则实现匹配。

有个好的思路，是给选择器的激活带上一个条件：父元素。

比如当.cls 匹配成功，后续*所匹配的所有元素的父元素就已经确定了，即本例中的div。



### 子代选择器“>”

```html

div>.cls {
    border:solid 1px green;
}
<div>
<span>1<span>
<span class=cls>2<span>
<span>
    3
    <span>4</span>
<span>
<span>5</span>
</div>
```

与后继选择器的思路类似，后继是将当前节点的父元素作为父元素，子代是拿当前节点作为父元素。

本例中，我们构造到div时，匹配了CSS的第一段，我们激活后面的.cls选择条件，并制定当前div为父原色，于是到span2就被选中了。



### 直接后继选择器“+”

很简单，由于只对唯一一个元素生效，不需要反复激活与关闭。

一个思路是：我们把它本身（如#id+.cls)当作每一个元素的选择器检查。

另一个思路是：给后继选择器加一个flag，使它匹配一次后失效。



### 列选择器“｜｜”

由于是针对表格的选择器，与表格的模型有关，这里略过。



### 其他

CSS还支持逗号分割，表示“或”，简单的实现是把逗号视为两条规则。

```

a#b, .cls {

}
// 视作

a#b {

}

.cls {

}

```

选择器还可能重合，这样我们可以使用树形结构来进行一些合并，提高效率：

```

#a .cls {

}

#a span {

}
#a>span {

}
```

构造成

- #a
  - < 空格 >.cls
  - < 空格 >span
  - \>span



## 浏览器排版

浏览器拿到了带CSS属性的DOM元素，现在要确定每一个元素的位置了。

前面的构建DOM树和计算CSS属性，产出都是一个一个的元素，但排版就没这么简单了。

尤其是表格相关排版、Flex排版和Grid 排版，子元素之间有关联性。

### 基本概念

“排版”来自于活字印刷，将铅字按顺序放入板框。排版就是确定每一个字的位置。

浏览器的排版很复杂，包括文字、图片、图形、表格等，也是在确定各个元素的位置。

浏览器的基本排版方案是**正常流排版**，与传统排版方式相似。

文字排版遵循文字排版规范，十分复杂，规定了行模型和文字排布。行模型又规定了行顶、行底、文字区域、基线等对齐方式。不同语言的书写顺序不一样，因此浏览器还要支持双向文字系统。

最常见的就是盒模型，元素被定义为长方形区域，还有边框、边距和留白。

正常流海支持两类元素：绝对定位元素和浮动元素

- 绝对定位元素把自身从正常流抽出，由top left 等属性确定位置，不参加排版计算，也不影响其他元素。由position控制
- 浮动元素是在正常流的位置向左或向右移动到边界，并占据一块排版空间。由float控制

除了正常流，浏览器还支持例如Flex排版，这些方式由外部元素的display属性控制。如inline等级还是block等级。



### 正常流文字排版

正常流是唯一一个文字和盒混排的排版方式。

类似书写，浏览器支持排版方向（书写一般从左到右，从上倒下，浏览器支持多种方式，还有主轴等属性）

![0619d38f00d539f7b6773e541ce6fa01](https://static001.geekbang.org/resource/image/06/01/0619d38f00d539f7b6773e541ce6fa01.png)

![c361c7ff3a11216c139ed462b9d5f196](https://static001.geekbang.org/resource/image/c3/96/c361c7ff3a11216c139ed462b9d5f196.png)



这两张图片来自著名开源字体解析库 freetype，图中的advance 代表每一个文字排布后在主轴上的前进距离，它跟文字的宽 / 高不相等，是字体中最重要的属性。除了字体提供的字形本身包含的信息，文字排版还受到一些 CSS 属性影响，如 line-height、letter-spacing、word-spacing 等。

在正常流的文字排版中，多数元素被当作长方形盒来排版，而只有 display 为 inline 的元素，是被拆成文本来排版的（还有一种 run-in 元素，它有时作为盒，有时作为文字，不太常用，这里不详细讲了）。

display 值为 inline 的元素中的文字排版时会被直接排入文字流中，inline 元素主轴方向的 margin 属性和 border 属性（例如主轴为横向时的 margin-left 和 margin-right）也会被计算进排版前进距离当中。

注意，当没有强制指定文字书写方向时，在左到右文字中插入右到左向文字，会形成一个双向文字盒，反之亦然。这样，即使没有元素包裹，混合书写方向的文字也可以形成一个盒结构，我们在排版时，遇到这样的双向文字盒，会先排完盒内再排盒外。

### 正常流的盒

在正常流中，display 不为 inline 的元素或者伪元素，会以盒的形式跟文字一起排版。多数 display 属性都可以分成两部分：内部的排版和是否 inline，带有 inline- 前缀的盒，被称作行内级盒。

根据盒模型，一个盒具有 margin、border、padding、width/height 等属性，它在主轴方向占据的空间是由对应方向的这几个属性之和决定的，而 vertical-align 属性决定了盒在交叉轴方向的位置，同时也会影响实际行高。

所以，浏览器对行的排版，一般是先行内布局，再确定行的位置，根据行的位置计算出行内盒和文字的排版位置。

块级盒比较简单，它总是单独占据一整行，计算出交叉轴方向的高度即可。

### 绝对定位元素

position 属性为 absolute 的元素，我们需要根据它的包含块来确定位置，这是完全跟正常流无关的一种独立排版模式，逐层找到其父级的 position 非 static 元素即可。

### 浮动元素排版

float 元素非常特别，浏览器对 float 的处理是先排入正常流，再移动到排版宽度的最左 / 最右（这里实际上是主轴的最前和最后）。移动之后，float 元素占据了一块排版的空间，因此，在数行之内，主轴方向的排版距离发生了变化，直到交叉轴方向的尺寸超过了浮动元素的交叉轴尺寸范围，主轴排版尺寸才会恢复。float 元素排布完成后，float 元素所在的行需要重新确定位置。

### 其它的排版

CSS 的每一种排版都有一个很复杂的规定，实际实现形式也各不相同。比如如 Flex 排版，支持了 flex 属性，flex 属性将每一行排版后的剩余空间平均分配给主轴方向的 width/height 属性。浏览器支持的每一种排版方式，都是按照对应的标准来实现的。

## 浏览器位图操作

终于要开始渲染了。

### 渲染

我们先来说说渲染这个词，它是render的翻译，在英文中，render是导致、变成的意思，也有粉刷墙壁的意思。计算机图形领域，render是个简写，是指把模型变成位图的过程。中文中的渲染是一种绘画技法，指的是沾清水把墨涂开。

现在很多框架，会把“从数据变成HTML代码的过程”叫做render，其实很有误导性，我们这里统一指把模型变成位图。

位图就是存在内存中的一张二维表格，把一张图片的每个像素对应的颜色保存进去，位图也是DOM树中占浏览器内存最多的信息，因此是内存优化的主要考虑点。

浏览器中的渲染，就是把每一个元素对应的盒变成位图。这里的元素包括HTML元素和伪元素。一个元素可能对应多个盒（比如inline，可能分成多行）。每一个盒对应一张位图。

渲染总的来说可以分成两大类：图形和文字

盒的背景、边框、SVG 元素、阴影等特性，都是需要绘制的图形类。这就像我们实现 HTTP 协议必须要基于 TCP 库一样，这一部分，我们需要一个底层库来支持。一般的操作系统会提供一个底层库，比如在 Android 中，有大名鼎鼎的 Skia，而 Windows 平台则有 GDI，一般的浏览器会做一个兼容层来处理掉平台差异。

盒中的文字，也需要用底层库来支持，叫做字体库。字体库提供读取字体文件的基本能力，它能根据字符的码点抽取出字形。字形分为像素字形和矢量字形两种。通常的字体，会在 6px 8px 等小尺寸提供像素字形，比较大的尺寸则提供矢量字形。矢量字形本身就需要经过渲染才能继续渲染到元素的位图上去。目前最常用的字体库是 Freetype，这是一个 C++ 编写的开源的字体库。

在最普遍的情况下，渲染过程生成的位图尺寸跟它在上一步排版时占据的尺寸相同。但是理想和现实是有差距的，很多属性会影响渲染位图的大小，比如阴影，它可能非常巨大，或者渲染到非常遥远的位置，所以为了优化，浏览器实际的实现中会把阴影作为一个独立的盒来处理。

注意，我们这里讲的渲染过程，是不会把子元素绘制到渲染的位图上的，这样，当父子元素的相对位置发生变化时，可以保证渲染的结果能够最大程度被缓存，减少重新渲染。



### 合成

合成是英文术语 compositing 的翻译，这个过程实际上是一个性能考量，它并非实现浏览器的必要一环。

合成的过程，就是为一些元素创建一个“合成后的位图”（我们把它称为合成层），把一部分子元素渲染到合成的位图上面。到底是为哪些元素创建合成后的位图，把哪些子元素渲染到合成的位图上面呢

这就是我们要讲的合成的策略。我们前面讲了，合成是一个性能考量，那么合成的目标就是提高性能，根据这个目标，我们建立的原则就是最大限度减少绘制次数原则。

我们举一个极端的例子。如果我们把所有元素都进行合成，比如我们为根元素 HTML 创建一个合成后的位图，把所有子元素都进行合成，那么会发生什么呢？那就是，一旦我们用 JavaScript 或者别的什么方式，改变了任何一个 CSS 属性，这份合成后的位图就失效了，我们需要重新绘制所有的元素。那么如果我们所有的元素都不合成，会怎样呢？结果就是，相当于每次我们都必须要重新绘制所有的元素，这也不是对性能友好的选择。那么好的合成策略是什么呢，**好的合成策略是“猜测”可能变化的元素，把它排除到合成之外。**

```html

<div id="a">
    <div id="b">...</div>
    <div id="c" style="transform:translate(0,0)"></div>
</div>
```

假设我们的合成策略能够把 a、b 两个 div 合成，而不把 c 合成，那么，当我执行以下代码时：

```javascript

document.getElementById("c").style.transform = "translate(100px, 0)";
```

我们绘制的时候，就可以只需要绘制 a 和 b 合成好的位图和 c，从而减少了绘制次数。这里需要注意的是，在实际场景中，我们的 b 可能有很多复杂的子元素，所以当合成命中时，性能提升收益非常之高。

目前，主流浏览器一般根据 position、transform 等属性来决定合成策略，来“猜测”这些元素未来可能发生变化。但是，这样的猜测准确性有限，所以新的 CSS 标准中，规定了 will-change 属性，可以由业务代码来提示浏览器的合成策略，灵活运用这样的特性，可以大大提升合成策略的效果。



### 绘制

绘制是把“位图最终绘制到屏幕上，变成肉眼可见的图像”的过程，不过，一般来说，浏览器并不需要用代码来处理这个过程，浏览器只需要把最终要显示的位图交给操作系统即可。

一般最终位图位于显存中，也有一些情况下，浏览器只需要把内存中的一张位图提交给操作系统或者驱动就可以了，这取决于浏览器运行的环境。不过无论如何，我们把任何位图合成到这个“最终位图”的操作称为绘制。

前面两个小节中，我们已经得到了每个元素的位图，并且对它们部分进行了合成，那么绘制过程，实际上就是按照 z-index 把它们依次绘制到屏幕上。

然而如果在实际中这样做，会带来极其糟糕的性能。有一个一度非常流行于前端群体的说法，讲做 CSS 性能优化，应该尽量避免“重排”和“重绘”，前者讲的是我们上一课的排版行为，后者模糊地指向了我们本课程三小节讲的三个步骤，而实际上，这个说法大体不能算错，却不够准确。

因为，实际上，“绘制”发生的频率比我们想象中要高得多。我们考虑一个情况：鼠标划过浏览器显示区域。这个过程中，鼠标的每次移动，都造成了重新绘制，如果我们不重新绘制，就会产生大量的鼠标残影。

这个时候，限制绘制的面积就很重要了。如果鼠标某次位置恰巧遮盖了某个较小的元素，我们完全可以重新绘制这个元素来完成我们的目标，当然，简单想想就知道，这种事情不可能总是发生的。

计算机图形学中，我们使用的方案就是“脏矩形”算法，也就是把屏幕均匀地分成若干矩形区域。

当鼠标移动、元素移动或者其它导致需要重绘的场景发生时，我们只重新绘制它所影响到的几个矩形区域就够了。比矩形区域更小的影响最多只会涉及 4 个矩形，大型元素则覆盖多个矩形。

设置合适的矩形区域大小，可以很好地控制绘制时的消耗。设置过大的矩形会造成绘制面积增大，而设置过小的矩形则会造成计算复杂。我们重新绘制脏矩形区域时，把所有与矩形区域有交集的合成层（位图）的交集部分绘制即可。


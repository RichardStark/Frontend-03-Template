# 重学JavaScript04——文法

文法是编译原理对语言写法的一种规定，一般分为**词法**和**语法**。

## 词法概述

词法规定了语言的最小单元，即token，可以翻译成“标记”或“词”。

JavaScript 中将源代码中的输入如下分类：

- WhiteSpace 空白字符
- LineTerminator 换行字符
- Comment 注释
- Token 词
  - IdentifierName 标识符名称，如变量名和关键字
  - Punctuator 符号，如运算符的大括号等
  - NumericLiteral 数字直接量，也就是数字
  - StringLiteral 字符串直接量，也就是单引号或双引号括起来的直接量
  - Template 字符串模版，也就是用反引号`括起来的直接量。

这种设计符合通用的编程语言设计方式。但JavaScript 有一些特使之处：

1. 除法和正则表达式冲突

JS支持 / 、/= 的除法运算， 也支持/abc/ 的正则运算。词法分析器无法处理这种冲突，JS的解决方案是定义了两组词法，依靠语法分析，传递一个标识给词法分析器，来决定使用哪一套词法。

2. 字符串模版

类似\`Hello, ${name}\`，理论上，${} 内部可以放任何JS表达式，而${} 中的表达式，是不能够有}的。

因此是否带} 就是两种情况，加上第一条除法和正则的区分，JS定义了四种：

- InputElementDiv；
- InputElementRegExp；
- InputElementRegExpOrTemplateTail；
- InputElementTemplateTail。

标准中把除法、正则表达式直接量、} 从token中抽出来，用词也改为了CommonToken。



一般的语言在词法分析过程，会丢弃除了token 之外的输入，但对JS来说，**换行符和注释还会影响语法分析过程**，这个后面详细讲。

综上，要实现JS的解释器，词法和语法分析十分麻烦，需要来回传递信息。

### 空白符号 Whitespace

空白符不光包括空格<SP>，还有例如Tab 符号\t<TAB>、垂直tab符号<VT>（不常用）\v、分页符(很少用)\f<FF>、NBSP即非断行空格&nbsp<NBSP>、零宽非断行空格（ES5新增）等<ZWNBSP>。

![img](https://static001.geekbang.org/resource/image/dd/60/dd26aa9599b61d26e7de807dee2c6360.png)

虽然有这么多，也不用担心，很多规范要求JS源代码控制在ASCII范围内，那么就只有

<TAB><VT><FF><SP><NBSP>

### 换行符LineTerminator

JS提供了四种换行符：

- <LF> 正常换行符，\n
- <CR> 回车，\r，Windows风格的编辑器中，换行是\r\n
- <LS> 行风格符
- <PS> 段落分隔符

大部分LineTerminator 会被词法分析器扫描丢弃，但换行符会触发两个特性：

- 自动插入分号
- no line terminator 规则



### 注释Comment

JS中有单行注释和多行注释：

- /* MultiLineCommentChars */ 
- // SingleLineCommentChars

多行注释中允许出现除了*之外的所有字符，而\* 之后不允许出现\。

除了四种LineTerminator，所有字符可以作为单行注释。

多行注释要注意是否包含换行符，会对JS语法产生影响，如“no line terminator” 规则。



### 标识符名称 IdentifierName

标识符的规则就是例如以$、_、或者Unicode 字母开头，除了开头，还可以使用- 、数字、连接符号。

任意字符都可以使用Unicode的转义写法，此时没有字符限制。

IdentifierName 可以是Identifier、NullLiteral、BooleanLiteral或者keyword，在ObjectLiteral中，IdentifierName还可以被当作属性名使用。仅仅当IdentifierName 不是保留字的时候，会被解析为Identifier。

<ZWNJ> 和<ZWJ> 是ES5新加入的两个格式控制字符，是0宽的。

关键字也属于IdentifierName， 包括，现有关键字：

```
await break case catch class const continue debugger default delete do else export extends finally for function if import ininstance of new return super switch this throw try typeof var void while with yield
```

保留关键字：

```
enum
```

严格模式下的关键字：

```
implements package protected interface private public
```

以及NullLiteral（null）和 BooleanLiteral（true false），不能用于Identifier。



### 符号 Puctuator

前面提到了除法和正则问题，/ 和/= 两个运算符拆分为DivPuctuator。

前面提到了字符串模版问题，} 也被独立拆分。

所有符号为：

```
{ ( ) [ ] . ... ; , < > <= >= == != === !== + - * % ** ++ -- << >> >>> & | ^ ! ~ && || ? : = += -= *= %= **= <<= >>= >>>= &= |= ^= => / /= }
```

### 数字直接量 NumericLiteral

JS支持四种写法：

- 十进制，可以带小数，支持科学计数法
- 二进制整数，0b
- 八进制整数，0o
- 十六进制整数，0x

注意：

```
12.toString() //Uncaught SyntaxError: Invalid or unexpected token
```

中的点，会被当作小数后面的点，如果想让点单独成为一个token，要加入空格

```
12 .toString()
```

### 字符串直接量StringLiteral

JS支持单引号双引号两种写法：

```
" DoubleStringCharacters "
' SingleStringCharacters '
```

注意转义，单字符转义SingleEscapeCharacter定义9种：

![022c2c77d0a3c846ad0d61b48c4e0e75](https://static001.geekbang.org/resource/image/02/75/022c2c77d0a3c846ad0d61b48c4e0e75.png)

除了9种、数字、x、u以及所有换行符，其他字符转义为自身。



### 正则表达式直接量RegularExpressionLiteral

正则表达式由Body 和Flags两部分组成

```
/RegularExpressionBody/g
```

Body 中至少有一个字符，且不能以*开头

正则[] 中的/ 会被认为是普通字符，而非遇到/就会停止。

除了\ / [ 三个字符之外，JS正则中的字符都是普通字符。 \会构成转义，正则中的flag 在词法阶段不会限制字符。

### 字符串模版Template

语法结构上，Template是个整体，${} 是并列关系，但实际上，在JS词法中${} 是拆开分析的。

如：

```
`a${b}c${d}e`
```

实际是当作：

```
`a${  //模版头
b			//普通标识符
}c${	//模版中段
d			//普通标识符
}e`		//模版尾
```

来处理的。

模版支持添加处理函数，此时模版的各段会被拆开，传递给函数当参数：

```javascript
function f(){
    console.log(arguments);
}

var a = "world"
f`Hello ${a}!`; // [["Hello", "!"], world]
```

模版字符串要处理${ 和` 的转义。

## 语法1——分号问题



行尾加分号，风格来自于Java、C 和 C++， 设计之初的目的是降低编译器的工作负担。

我是“加分号”党，但如何中立地看这件事情？自动加分号又是如何实现的呢？

### 自动插入分号的规则

自动插入分号规则独立于所有语法产生式定义，规则有三条：

- 要有换行符，且下一个符号是不符合语法的，就尝试插入分号

  ```
  let a = 1 // 1 后接void是不合法的，插入换行符
  void function(a){
      console.log(a);
  }(a);
  ```

  

- 有换行符，且语法中规定此处不能有换行符，就自动插入分号

  ```
  var a = 1, b = 1, c = 1;
  a
  ++
  b
  ++
  c
  ```

  a 后面跟++是合法的，但在JS标准中，有no LineTerminator here，

  ```
  UpdateExpression[Yield, Await]:
      LeftHandSideExpression[?Yield, ?Await]
      LeftHandSideExpression[?Yield, ?Await][no LineTerminator here]++
      LeftHandSideExpression[?Yield, ?Await][no LineTerminator here]--
      ++UnaryExpression[?Yield, ?Await]
      --UnaryExpression[?Yield, ?Await]
  ```

   表示这是一个语法规则。因此a结果为1，b和c为2。

  ```
  function f(){
      return/*
          This is a return value.
      */1;
  }
  f();
  ```

  虽然带换行符的注释也被认为是有换行符，而return也有[no LineTerminator here]规则，所以这里会加上分号，返回值是undefined

- 源代码结束处，不能形成完整的脚本或模块结构，就自动插入分号。

### no LineTerminator here 规则

也就是说，要靠着自动加分号的规则，就要挖一下JS的语法定义。

[no LineTerminator here] 表示所在结构的这一位置不能插入换行符。对应上面的第二条规则。

![img](https://static001.geekbang.org/resource/image/c3/ad/c3ffbc89e049ad1901d4108c8ad88aad.jpg)

### 不写分号需要注意

#### 以括号开头的语句

```
(function(a){
    console.log(a);
})()
(function(a){
    console.log(a);
})()
```

这段代码形成了两个IIFE（立即执行的函数），第三行结束的位置，JS引擎会认为函数的返回可能是函数，因此后面跟括号是合理的，就不会自动加上分号。因此代码会报错。

因此这也是鼓励不写分号的编码风格，要求在写IIFE时要在行首加分号的原因。

#### 以正则表达式开头的语句

```
var x = 1, g = {test:()=>0}, b = 1/*这里没有被自动插入分号*/
/(a)/g.test("abc")
console.log(RegExp.$1)
```

正则的第一个斜杠被认为成除号，后面的意思就变了。虽然不会报错，但这样反而更致命更难以调试。

#### 以Template开头的语句

```

var f = function(){
  return "";
}
var g = f/*这里没有被自动插入分号*/
`Template`.match(/(a)/);
console.log(RegExp.$1)
```

f 会结合` 被认为是与template一体的，会莫名其妙地执行一次，同样难以调试。

## 语法2——基本规则

### 脚本与模块

JS包含了两种源文件，一种是脚本，一种是模块。这是在ES6中引入了模块机制后开始的，ES5以及之前版本只有脚本。

脚本呢就是由浏览器或者node环境引入来执行的，而模块只能由JS代码用import引入执行。

脚本是主动的，是控制宿主完成一系列任务的代码。模块式被动的Javascript代码段，是等待被调用的库。

对比标准中的语法产生式，二者的区别仅仅在于是否包含import 和export。

现代浏览器可以用script标签引入模块或者脚本，引入模块要加上type=“module”，引入脚本则不需要type。

```
<script type="module" src="xxxxx.js"></script>
```

**因此，scirpt 标签如果不加type，而我们引入的文件里有export，就会抛错。**

综上，JavaScript 的程序可以如下分类

![43fdb35c0300e73bb19c143431f50a44](https://static001.geekbang.org/resource/image/43/44/43fdb35c0300e73bb19c143431f50a44.jpg)

### import 声明

import 声明有两种用法：

- 直接import 一个模块
- 带from的import，引入模块里的一些信息

直接import 一个模块，是保证了这个模块代码被执行，引用它的模块无法获得它的任何信息。

带from的import 是引入模块的部分信息，变成本地变量，又包含三种用法：

- import x from "./a.js" 引入模块中导出的默认值
  - import d,{a as x, modify} from "./a.js"
  - import d, * as x from "./a.js"
- import {a as x, modify} from "./a.js"; 引入模块中的变量
- import * as x from "./a.js" 把模块中所有的变量以类似对象属性的方式引入

语法要求不带as 的默人值永远在最前，**注意这里的变量实际上仍然可以受到原来模块的控制。**

例如：

模块a

```javascript
export var a = 1;

export function modify(){
    a = 2;
}

```

模块b

```javascript
import {a, modify} from "./a.js";

console.log(a);

modify();

console.log(a);
```

当我们调用modify后，b模块变量也跟着变了，说明导入与一般的赋值不同，**导入后的变量只是改了名字，与原来变量是同一个**。

### export 声明

与import 相对，export 声明是导出的任务。

导出的方式有两种：

- 独立使用export 声明

  export {a, b, c}

- 在声明型语句前加export

  - var
  - function(包含async和generator)
  - class
  - let
  - const

- 特殊用法 export default， 导出一个默认变量值，可以用于function 和class。导出的变量没有名称，可以使用import x from "./a.js" 引入

  - export default 还支持一种语法，后面跟表达式

    ```
    var a = {};
    export default a;
    ```

    这里的行为与导出变量不一致，**这里导出的是值**，以后a的变化与导出的值无关，修改变量a，不会使其他模块中引入的default值发生变化

import 语句前无法加入export，但可以export from

export a from "a.js"

### 函数体

```
setTimeout(function(){
    console.log("go go go");
}, 10000)
```

这段代码通过setTimeout 函数注册了一个函数给宿主，当一定时间后，宿主就会执行这个函数。宿主会为这样的函数创建宏任务。

宏任务中可能会执行的代码包括：脚本、模块和函数体。

函数体实际上有四种：

- 普通函数体 function
- 异步函数体 async function
- 生成器函数体 function *foo
- 异步生成器函数体 async function *foo

区别在于能否使用await 或者yield。 生成器能执行yield， 一步能执行await

![0b24e78625beb70e3346aad1e8cfff50](https://static001.geekbang.org/resource/image/0b/50/0b24e78625beb70e3346aad1e8cfff50.jpg)



### 全局机制

全局机制包括预处理和指令序言。不理解预处理，就无法理解var 等声明类语句的行为；不理解指令序言，就无法解释严格模式。

#### 预处理

JavaScript 执行前，会对脚本、模块和函数体中的语句进行预处理。预处理过程将会**提前处理var、函数声明、class、const和let，以确定其中变量的意义**，也就是说，无论声明在什么位置，这些代码会部分提前。

而由于历史包袱，规则稍微有些复杂。

##### var

var 声明永远作用于脚本、模块和函数体这个级别。

预处理阶段，不关心赋值部分，只管在当前作用域声明这个变量。

例1:

```javascript
var a = 1;

function foo() {
    console.log(a);
    var a = 2;
}

foo();
```

输出undefined！因为 a = 2 是函数体级别的a，但出现在console.log(a) 之后。

预处理过程中：

由于有函数体级别的a，不会访问外层作用域的a。

由于函数体级别的a 先声明，但不会赋值，所以是打印undefined。

例2:

```javascript
var a = 1;

function foo() {
    console.log(a);
    if(false) {
        var a = 2;
    }
}

foo();
```

虽然 a=2 永远不会执行，但预处理阶段不管，var 的作用能够穿透一切语句结构，只认脚本、模块和函数体三种语法结构，还是undefined。

例3:

```javascript
var a = 1;

function foo() {
    var o= {a:3}
    with(o) {
        var a = 2;
    }
    console.log(o.a);
    console.log(a);
}

foo();
```

这个在讲运行时的时候讲过。

with语句创建了一个作用域，把o对象加入了词法环境，其中使用了 var a = 2

预处理阶段，由于只认var中声明的变量，所以也为foo作用域提供了a这个变量，但没有赋值。

在执行阶段，a又作为了对象o 的属性。

因此结果为2 和undefined。

再次声明，这是JavaScript 公认的失误，一个语句中的a 在预处理阶段和执行阶段表示了两个不同的变量，严重违背直觉，所以要特别注意。



早年JS没有let 和const， 而var 除了脚本和函数体，都会穿透，因此人们发明了IIFE的用法，来产生作用域

一道典型的面试题是：

```
for(var i = 0; i < 20; i ++) {
    void function(i){
        var div = document.createElement("div");
        div.innerHTML = i;
        div.onclick = function(){
            console.log(i);
        }
        document.body.appendChild(div);
    }(i);
}
```

为文档增加了20个div元素，并绑定了点击事件，打印了它们的序号。

IIFE在循环内构造了作用域，每次循环都产生一个新的环境记录，这样每个div都能访问到环境中的i。

如果不使用IIFE：

```
for(var i = 0; i < 20; i ++) {
    var div = document.createElement("div");
    div.innerHTML = i;
    div.onclick = function(){
        console.log(i);
    }
    document.body.appendChild(div);
}
```

由于全局只有一个i，执行循环后，i成了20。

##### function

function 的声明行为，原来和var 十分相似，但最新的JavaScript 标准中，对它进行了一定的修改，反而，更复杂了。

全局情况下，例如脚本、模块、函数体，function声明表现与var 相似，不同在于function声明不但在作用域中，**还会给它赋值**

```
console.log(foo);
function foo(){
	var a = 1
}
```

此时foo能打印出其具体声明。

但function 出现在if 等语句中，预处理阶段，仍然产生变量，但不再被提前赋值。

```
console.log("out",foo);
if(true) {
		console.log("in", foo);
    function foo(){
			var a = 1
    }
}
```

此时out结果为undefined。

in 结果就是foo的定义，说明function作用域被提前到了if中。

##### class

class 与function 和var 都不一样

class 之前使用class名，会抛错。

```
console.log(c);
class c{

}
```

感觉像是class没有预处理，实际上并不是。

```
var c = 1;
function foo(){
    console.log(c);
    class c {}
}
foo();
```

如果没有预处理，按道理应当打印外层的c，但还是会抛错，也就是说，class也是会被预处理的，他会在作用域中创建变量，并要求在未定以前，访问到它时抛出错误。

class的声明不会穿透if等语句结构，后面会讲。

显然class的设计比function和var 更符合直觉。

#### 指令序言

脚本和模块都支持指令序言（Directive Prologs）

指令序言就是为use strict 设计的，规定了一种给JS代码添加元信息的方式。

严格模式的特征就是：

```
"use strict";
function f(){
    console.log(this);
};
f.call(null);
```

如果去掉严格模式，this 则为global

而use strict 也是JS中唯一一种指令序言，它只能出现在脚本、模块和函数体最前面。是一种为JS引擎和实现者提供一种统一的表达方式，在静态扫描时指定JS代码的一些特性。（例如no-lint 的实现，避免lint检查）。

## 语法3——具体语句

上一节讲了一下JS语法的顶层设计，这里落一下地。

JS与多数编程语言一样，遵循“语句-表达式”结构，无论是脚本还是模块，都是由语句列表构成。

语句在JavaScript标准中分两种：**声明和语句**，但这么分不符合直觉。我来分一下：

- **普通语句**

![8186219674547691cf59e5c095304d55](https://static001.geekbang.org/resource/image/81/55/8186219674547691cf59e5c095304d55.png)



- **声明型语句**

  ![0e5327528df12d1eaad52c4005efff38](https://static001.geekbang.org/resource/image/0e/38/0e5327528df12d1eaad52c4005efff38.jpg)

### 语句块

语句块就是一对大括号。

语句块可以把多行语句视为同一行，**语句块产生作用域**

```
{
    let x = 1;
}
console.log(x); // 报错
```



#### 空语句

空语句就是独立的一个分号，无卵用。考虑到的是设计的完备性，和多写一个分号不会抛错。



### if语句

没什么好讲的，都一样



### switch语句

继承自Java，完全可以用if else 代替，偏要写的话别忘了break



### 循环语句



#### while/do while 循环

do while 多执行一遍



#### 普通for

没什么，都一样



#### for in循环

for in循环枚举对象的属性，体现了属性enumerable 的特征

```
let o = { a: 10, b: 20}
Object.defineProperty(o, "c", {enumerable:false, value:30})

for(let p in o)
    console.log(p);
```

如上例，添加了不可枚举的c， 因此遍历不到，enumerable 改为true 就能遍历到了。



#### for of循环 和 for await of 循环

基本用法，可以用于数组

```javascript
for(let e of [1, 2, 3, 4, 5])
    console.log(e);
```

实际背后机制是iterator。我们可以给任何对象添加iterator， 使他可以用于for of

```javascript
let o = {  
    [Symbol.iterator]:() => ({
        _value: 0,
        next(){
            if(this._value == 10)
                return {
                    done: true
                }
            else return {
                value: this._value++,
                done: false
            };
        }
    })
}
for(let e of o)
    console.log(e);

```

实际操作中，我们一般不需要如此定义iterator，可以使用generator function

```javascript
function* foo(){
    yield 0;
    yield 1;
    yield 2;
    yield 3;
}
for(let e of foo())
    console.log(e);
```

也为异步生成器配备了异步的for of：

```javascript
function sleep(duration) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve,duration);
    })
}
async function* foo(){
    i = 0;
    while(true) {
        await sleep(1000);
        yield i++;
    }
        
}
for await(let e of foo())
    console.log(e);
```

这是一个每隔一秒生成一个数字的无限生成器。可以用来作为时钟。

### return

终止函数，返回值，没什么特殊



### break 和 continue

这俩属于控制型语句，用法相似，break用于跳出循环或switch，continue用于结束本次循环继续下次循环。

但它俩都有带标签的用法。

```javascript
outer:for(let i = 0; i < 100; i++)
    inner:for(let j = 0; j < 100; j++)
        if( i == 50 && j == 50)
            break outer;
outer:for(let i = 0; i < 100; i++)
    inner:for(let j = 0; j < 100; j++)
        if( i >= 50 && j == 50)
            continue outer;
```



### with语句

公认的糟粕，别用了。看得懂就行：

```javascript
let o = {a:1, b:2}
with(o){
    console.log(a, b);
}
```

把对象的属性在其作用域内变成对象



### try 和 throw

try 捕获异常， throw 抛出异常，catch 用于后序处理，finally 用于清理工作。

注意catch 会创建一个局部作用域，并把一个变量写入其中，**这个作用域不能定义变量e，否则抛错**

finally前面讲过，一定会执行



### debugger

表示调试器在此断点，没有调试器则没有任何效果



### var

大多数情况，let 和const 是更好的选择，注意它的预处理机制。

如果一定要用，遵循：

- 声明同时必定初始化
- 尽可能就近声明
- 不要在意重复声明



### let 和const

新语法，没什么硬伤，非常符合直觉。let和const的作用范围是if 、 for 等结构型语句。

let 能重复赋值， const 赋值后不可变。

let 和const 声明看上去是执行了才会生效，实际也是会被预处理，如果当前作用域有声明，就无法访问到外部，如：

```

const a = 2;
if(true){
    console.log(a); //抛错
    const a = 1;   
}
```

说明仍然有预处理，机制与class相似。



### class 声明

与类行为类似，内部可以定义constructor 关键字来定义构造函数，还有getter/setter 以及方法。

```

class Rectangle {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  // Getter
  get area() {
    return this.calcArea();
  }
  // Method
  calcArea() {
    return this.height * this.width;
  }
}
```

**注意，class默认内部的函数定义都是strict 模式的**



### 函数声明

```javascript


function foo(){

}

function* foo(){
    yield 1;
    yield 2;
    yield 3;
}

async function foo(){
    await sleep(3000);
    
}

async function* foo(){
    await sleep(3000);
    yield 1;
}

```

带*的函数是generator ，返回一个序列的函数，底层是iterator机制

async函数是可以暂停，等待异步操作的函数，底层是Promise机制

函数的参数，可以只写形参名，可以写默认值，也可指定多个参数：

```
function foo(a = 1, ...other) {
    console.log(a, other)
}
```



## 语法4——表达式语句（左侧）

表达式语句就是一个表达式，由运算符连接变量或直接量构成。

表达式一般来说要么是函数调用，要么是赋值，要么是自增自减，否则计算结果没有意义。但语法上并没有限制，比如 a+b ，计算了和，不显示，也不产生任何效果，但不妨碍它能执行。

### PrimaryExpression 主要表达式

表达式的原子项，是表达式的最小单位，优先级也最高。

PE包含了各种“直接量”，直接量就是直接写出来的具有特定类型的值。

```
// 基本类型的直接量
"abc";
123;
null;
true;
false;
// 对象等直接量形式，避免与声明语句冲突，要加括号
({});
(function(){});
(class{ });
[];
/abc/g;
//this 或者变量
this;
myVar;
// 任何表达式加上圆括号
(a + b);
```

这些结构在JS标准中，有的称作直接量（Literal）有的称（**Expression），我们都叫直接量比较合适



### MemberExpression 成员表达式

```
a.b; // 用标识符的属性访问
a["b"]; // 用字符串的属性访问
new.target; // 新语法，判断函数是否是被new调用
super.b; // 访问父类的属性
```

ME从名字看，就是为访问属性设计的。不过从语法结构需要，以下两种也属于ME：

```
f`a${b}c`;	//带函数的模版
new Cls();	//带参数列表的new 运算，不带参数列表的new运算优先级更低，不属于ME
```



### NEWExpression NEW表达式

就是ME加上new ，就是New Expression，这里的NE特指没有参数列表的表达式。

new new Cls(1);

它可能是：

new (new Cls(1));

new (new Cls)(1);

实际上是第一种，验证一下：

```
class Cls{
  constructor(n){
    console.log("cls", n);
    return class {
      constructor(n) {
        console.log("returned", n);
      }
    }
  }
}

new (new Cls(1));
```

结果是cls 1， returned undefined，说明1 倍当作调用Cls的参数传入了

### CallExpression 函数调用表达式

ME还能构成Call Expression，即ME后加一个括号里的参数列表，或者用super关键字代替ME。

```

a.b(c);
super();

//变体

a.b(c)(d)(e);
a.b(c)[3];
a.b(c).d;
a.b(c)`xyz`;
```

变体形态，跟ME几乎一一对应，可以理解为ME中的某一子结构有函数调用，那么整个表达式就成为了一个CE。CE失去了比NE优先级高的特性。



### LeftHandSideExpression 左值表达式

NE和CE统称LHSE。

左值表达式，就是可以放到等号左边的表达式。

LHSE最经典的用法是构成赋值表达式。

### AssignmentExpression 赋值表达式

AE也有多种形态

```
a = b

a = b = c = d	//等号可以嵌套，也就是右结合的，类似下面这种，但并不推荐这么写，炫技

a = (b = (c = d))

a += b; // 还有其他的，如*=
```

### Expression

AE可以构成Expression表达式的一部分，JS中，表达式就是用逗号运算符连接的赋值表达式

很多场合，是不允许使用逗号表达式的，比如我们说export后只能跟赋值表达式，也就是表达式中不能有逗号。

## 语句5——表达式语句（右侧）

JS标准中，规定等号右边的表达式叫条件表达式ConditionalExpression，但其实是RightHandSideExpression，但标准中没有这么说。

我们将原来的优先级概念，从语法的角度来看，就是表达式结构。我们说“乘法的运算优先级高于加法”，实际上在语法来说就是“乘法表达式和加号运算符构成加法表达式”。

对于RHSE，我们可以理解为以LHSE为最小单位开始构成。

### UpdateExpression 更新表达式

左值表达式搭配++ -- 构成更新表达式

```

-- a;
++ a;
a --
a ++
```

ES2018中，前后自增自减运算被放到了同一优先级

### UnaryExpression一元运算表达式

```

delete a.b;
void a;
typeof a;
- a;
~ a;
! a;
await a;
```

### ExponentiationExpression 乘方表达式

```

++i ** 30
2 ** 30 //正确
-2 ** 30 //报错
```

-2 这种一元表达式不能放入乘方表达式，除非加括号。

** 是右结合的！！！

4 ** 3 ** 2 => 4 ** (3 ** 2)



### MultiplicativeExpression 乘法表达式

乘方表达式可以构成乘法表达式，用乘号或者除号、取余符号连接



### AdditiveExpression 加法表达式

加法表达式由乘法表达式用 + - 号连接构成



### 移位表达式ShiftExpression

移位由加法表达式构成

```
<< 向左移位
>> 向右移位
>>> 无符号向右移位
```



### 关系表达式RelationalExpression

移位表达式构成关系表达式

```

<=
>=
<
>
instanceof 
in
```

注意 大于等于和小于等于是针对数字的，所以小于等于不等价于小于或等于

```

null <= undefined
//false
null == undefined
//true
```

### 相等表达式EqualityExpression

相等表达式由关系表达式用相等比较运算符连接，如

a instanceof "object" == true

运算符包括 ==、！=、===、！==

著名的设计失误是==，避免使用

==的规则位三条：

- undefined 与null相等
- 字符串和bool都转换为数字再比较
- 对象转换成primitive类型再比较

因此有些不符合直觉

false == '0' true

true == 'true' false

[] == 0 true

[] == false true

new Boolean('false') == false false



- 一个是即使字符串与 boolean 比较，也都要转换成数字；
- 另一个是对象如果转换成了 primitive 类型跟等号另一边类型恰好相同，则不需要转换成数字。

### 位运算表达式

按位与表达式 BitwiseANDExpression

按位异或表达式 BitwiseANDExpression

按位或表达式 BitwiseORExpression。



异或运算有个特征，那就是两次异或运算相当于取消。所以有一个异或运算的小技巧，就是用异或运算来交换两个整数的值。

```


let a = 102, b = 324;

a = a ^ b;
b = a ^ b;
a = a ^ b;

console.log(a, b);
```

按位或运算常常被用在一种叫做 Bitmask 的技术上。Bitmask 相当于使用一个整数来当做多个布尔型变量，现在已经不太提倡了。不过一些比较老的 API 还是会这样设计，比如我们在 DOM 课程中，提到过的 Iterator API，我们看下例子：

```

var iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT, null, false);
var node;
while(node = iterator.nextNode())
{
    console.log(node);
}
```

这里的第二个参数就是使用了 Bitmask 技术，所以必须配合位运算表达式才能方便地传参。



### 逻辑与表达式和逻辑或表达式

这两种表达式都不会做类型转换，所以尽管是逻辑运算，但是最终的结果可能是其它类型。这两种表达式都不会做类型转换，所以尽管是逻辑运算，但是最终的结果可能是其它类型。

false || 1; 得到1

false && undefined; 得到undefined

短路特性： true || foo(); foo不会执行



### 条件表达式ConditionalExpression

即三目运算符

condition ? branch1 : branch2

短路特性：条件表达式也像逻辑表达式一样，可能忽略后面表达式的计算。这一点跟 C 语言的条件表达式是不一样的。条件表达式实际上就是 JavaScript 中的右值表达式了 RightHandSideExpression，是可以放到赋值运算后面的表达式。
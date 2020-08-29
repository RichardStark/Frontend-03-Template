学习笔记

为什么 first-letter 可以设置 float 之类的，而 first-line 不行呢？

因为first-letter伪元素实现时可以作为一个dom节点处理，dom节点内的内容是确定的。
但是first-line内的文本是不固定的，假如设置了float或position属性，会脱离文档流，脱离了整个段落也就不能作为段落的第一行。
逻辑是矛盾的，所以不能设置float。
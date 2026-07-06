---
title: Moment-DETR模型-论文阅读
description: "《QVHIGHLIGHTS: Detecting Moments and Highlights in Videos via
  Natural Language Queries》论文阅读笔记"
excerpt: "《QVHIGHLIGHTS: Detecting Moments and Highlights in Videos via Natural
  Language Queries》这篇论文在2021年发表于NeurIPS,为TSGV方向构建了数据集，提供了baseline，对后续的研究有重大影响。"
publishDate: 2026-07-06
sortOrder: 0
section: study
tags:
  - 科研
  - 论文阅读
featured: false
draft: false
---
首先《QVHIGHLIGHTS: Detecting Moments and Highlights in Videos via Natural Language Queries》这篇论文是要解决什么问题，总共是两个任务，第一个任务叫做Moment Retrieval，下面简称MR，也就是时刻定位，这个和是TSGV的任务描述较为接近，都是给出一个query然后模型去预测moment的边界，第二个任务叫做Highlight Detection,下面简称HD，也就是高光检测，也就是对符合用户查询的高光clips打一个五级saliency分数，从Very Bad到Very Good。如下图：



在以往的研究中存在如下问题，首先MR研究和HD研究是分开的，没有放在一个数据集上完成；不少数据集中moments都位于视频开头，数据集存在时序偏见；对于MR任务来说，用户给出一个query，最后得到的moment只有一个，但也许一个视频中存在间隔着的但是都符合query的moments；对于HD任务，highlights不会随着query改变而改变。为了解决这些问题，作者搭建了一个数据集QVHighlights,这个数据集同时支持MR和HD任务，时序偏见不明显，而且标注了五级saliency分数。同时作者受到DETR启发，设计了Moment-DETR模型，这是一个端到端的transformer encoder-decoder架构，他将MR视为集合预测问题，这样的话就消除了以往需要人工的预处理步骤比如proposal generation，以及后处理步骤non-maximum suppression。

![](file:///C:\TEMP\ksohtml24948\wps2.jpg)![](file:///C:\TEMP\ksohtml24948\wps3.jpg) 

从上面两张图中也可以印证作者所讲的，作者设计的数据集上面同时支持两项任务，而且moments分布比较均匀，没有出现集中在视频前面的情况。作者还讲了数据集的具体构建细节，这个不是重点就略过了。

![](file:///C:\TEMP\ksohtml24948\wps4.jpg) 

上图是Moment-DETR的整体架构：transformer encoder的输入是投影后的视频特征和查询文本特征的拼接。每个encoder层有多头自注意力层和前馈神经网络FFN，也有positional encodings用于时序建模。然后decoder也是由一叠T层的transformer decoder layers构成的，每个decoder层包含多头自注意力层、cross-attention layer和FFN。decoder的输入叫做moment queries,其实就是N个候选槽位，这些槽位之间会互相分工，输出候选的预测结果向量。最后预测头预测结果，对于encoder的输出向量，使用一个线性层直接就可以得到显著性分数（因为经过encoder的操作每一个clip和query已经互相了解彼此，也知道互相的关联，可以直接根据每个clip的encoder表示直接预测它的显著性分数）；对于decoder的输出向量，也就是moment queries的表示，通过一个三层FFN得到预测结果的center和width；最后模仿DETR的做法使用一个带softmax的线性层预测类别标签（表明是否存在），对于一个预测moment，如果它与某个ground truth匹配，我们将其赋为foreground label，否则赋为background label。

损失函数的设计：

![](file:///C:\TEMP\ksohtml24948\wps5.jpg) 

公式（1）是用来做配对的，如果某个预测moment认为自己是foreground的概率高并且它与真实moment位置误差小，那它就更加匹配这个真实的moment。

![](file:///C:\TEMP\ksohtml24948\wps6.jpg) 

公式（2）衡量当前预测moment与真实moment的差异，L1损失主要关注于center与width，IoU损失主要关注于重叠程度。

![](file:///C:\TEMP\ksohtml24948\wps7.jpg) 

公式（3）是显著性分数的损失函数，它要求高saliency clip分数高于低saliency clip分数，真实moment内的clip分数高于moment外的clip分数。

![](file:///C:\TEMP\ksohtml24948\wps8.jpg) 

公式（4）把三类loss函数加起来，就得到最终的损失函数了。

这一套端到端的transformer架构有大量的参数，往往需要更大的数据集，所以作者就采用了ASR captions进行预训练，这个数据集胜在量大，无需人工标注，只需要用字幕信息作为query就行，当然它的缺点就是字幕不一定和视频内容对得上，而且没有像QVHighlights一样进行了精心设计，所以和下游任务不能完美对上，但是用作预训练能提升模型性能。

![](file:///C:\TEMP\ksohtml24948\wps9.jpg) 

上面这个是性能对比图，比如说R1@0.5,就是看top1预测的IoU有没有达到0.5，如果达到了就算预测正确。R1@0.7类似。mAP@0.5,AP指的是Precision-Recall曲线下面的面积，这个指标意味着对所有预测结果的AP求平均，如果IoU大于0.5就算预测正确，mAP@0.7同理。然后HIT@1意味着只选最高分的clip有没有命中Very Good。可以看到没有预训练的Moment-DETR还算不上性能全面超越之前模型，但是预训练过后各方面指标提升很多，除了HIT@1，都已达到最好，而且HIT@1指标是有局限性的，它单单表示最显著的clip，整体的highlights排序是否好。

最后作者做了一些实验来测试自己的设计。消融实验证明saliency loss不仅与HD相关还与MR相关，L1和gIoU和MR相关，但和HD不明显相关，如下图。

![](file:///C:\TEMP\ksohtml24948\wps10.jpg) 

然后还说明了模型的不同预测槽位分化出了不同的分工，对于预测片段的长短和位置都各有偏好，如下图，靠左就是偏向预测开头，往上就是偏向预测更长。

![](file:///C:\TEMP\ksohtml24948\wps11.jpg) 

 

最后作者展示了预测的结果与真实情况对比，以及在不同类型的视频下模型的性能对比，如下图。

![](file:///C:\TEMP\ksohtml24948\wps12.jpg) 

 

![](file:///C:\TEMP\ksohtml24948\wps13.jpg)

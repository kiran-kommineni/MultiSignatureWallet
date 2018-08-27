Security practices
------------------
1) Used someAddress.transfer() instead of someAddress.call.value()()
   call.value() will send the ether and trigger code execution which is unsafe. At the same time push mechanism used by send() and transfer() are much safer than pull mechanism like call.value()()
   
2) We have made sure that the vaiables like contibutions and proposals are kept private and specified function modifiers where ever necessary so that there is a control mechanism.

3) Access specifiers like 'external', 'view' are specified to functions where ever necessary so that we restrict access to specified function callers.

4) Transfer or send functions are specified in the last to eliminate race around conditions which might happen similar to DAO hack

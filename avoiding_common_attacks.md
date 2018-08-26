Security practices
------------------
1) Used someAddress.transfer() instead of someAddress.call.value()()
   call.value() will send the ether and trigger code execution which is unsafe. At the same time push mechanism used by send() and transfer() are much safer than pull mechanism like call.value()()
   
2) 

(function(root){'use strict';class Dictionary{
 constructor(fetcher=globalThis.fetch?.bind(globalThis)){this.fetcher=fetcher;this.pending=null;this.words=null;this.meta=null;}
 async load(){if(this.words)return this.meta;if(this.pending)return this.pending;this.pending=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await this.fetcher('assets/skeleton/dictionary.json?v=1',{signal:controller.signal});if(!response.ok)throw Error('Dictionary HTTP error');const data=await response.json();if(data.format!=='kana-skeleton-jmdict'||data.version!==1||!Array.isArray(data.words)||data.words.length!==data.wordCount||data.wordCount<10000||data.words.some(w=>typeof w!=='string'||!/^[ぁ-ゖー]{2,7}$/u.test(w)))throw Error('Invalid dictionary');const words=new Set(data.words);if(words.size!==data.wordCount)throw Error('Duplicate dictionary');this.words=words;const {words:omit,...meta}=data;this.meta=meta;return meta;}finally{clearTimeout(timer);}})();try{return await this.pending;}finally{this.pending=null;}}
 async check(words){await this.load();return Object.fromEntries(words.map(word=>[word,this.words.has(word.normalize('NFC'))]));}
}
if(typeof module!=='undefined'&&module.exports)module.exports={Dictionary};else root.SkeletonDictionary={Dictionary};
})(typeof window!=='undefined'?window:globalThis);

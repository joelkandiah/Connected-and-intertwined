import{j as e}from"./index-BgpIPabS.js";import{b as r,L as l}from"./vendor-BO-UU5I_.js";const p=()=>{const[o,s]=r.useState([]),t=r.useMemo(()=>["💒","💍","💐","❤️","💑","🎉","🥂","💕"],[]);r.useEffect(()=>{const a=[];for(let n=0;n<15;n++)a.push({id:Date.now()+n,emoji:t[Math.floor(Math.random()*t.length)],left:Math.random()*100,delay:Math.random()*5,duration:3+Math.random()*4});s(a);const i=setInterval(()=>{s(n=>[...n.slice(-19),{id:Date.now(),emoji:t[Math.floor(Math.random()*t.length)],left:Math.random()*100,delay:0,duration:3+Math.random()*4}])},800);return()=>clearInterval(i)},[t]);const d=r.useMemo(()=>[{name:"Connections",path:"/connections",description:"Find groups of four!"},{name:"The Mini",path:"/wedding-crossword",description:"Wedding crossword puzzle"},{name:"Wedding Strands",path:"/wedding-strands",description:"Find the hidden words"},{name:"Our Timeline",path:"/our-timeline",description:"Arrange events in order"}],[]);return e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 relative overflow-hidden",children:[e.jsx("div",{className:"fixed inset-0 pointer-events-none overflow-hidden",style:{zIndex:1},children:o.map(a=>e.jsx("div",{className:"absolute text-4xl animate-fall",style:{left:`${a.left}%`,animationDelay:`${a.delay}s`,animationDuration:`${a.duration}s`,top:"-60px"},children:a.emoji},a.id))}),e.jsxs("div",{className:"relative z-10 max-w-4xl mx-auto",children:[e.jsxs("div",{className:"text-center mb-12",children:[e.jsx("h1",{style:{fontSize:"clamp(2rem, 5vw, 3rem)",paddingTop:"60px"},className:"font-bold mb-2 animate-fadeIn text-gray-900 dark:text-gray-100",children:"Welcome to our wedding! 💕"}),e.jsx("p",{className:"text-2xl md:text-3xl text-gray-600 dark:text-gray-300 animate-fadeIn",style:{animationDelay:"0.3s"},children:"Sofia and Joel invite you to try some of our favourite puzzles with a wedding day twist!"})]}),e.jsx("div",{className:"grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-3 sm:scale-90 mt-16 sm:mt-8",children:d.map((a,i)=>e.jsxs(l,{to:a.path,className:`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 
                         p-6 sm:p-4 text-center transform hover:-translate-y-2 animate-fadeIn`,style:{animationDelay:`${.5+i*.2}s`},children:[e.jsx("h2",{className:"text-2xl sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors",children:a.name}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300 text-base sm:text-sm",children:a.description}),e.jsx("div",{className:"mt-4 text-pink-500 dark:text-pink-400 group-hover:translate-x-2 transition-transform inline-block",children:"→"})]},a.path))}),e.jsx("div",{className:"text-center mt-16 text-6xl animate-fadeIn",style:{animationDelay:"1.1s"},children:"❤️ 💍 ❤️"})]}),e.jsx("style",{children:`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
      `})]})};export{p as default};

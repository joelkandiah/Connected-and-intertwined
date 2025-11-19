import{j as a}from"./index-DO4DlgWM.js";import{b as r,L as l}from"./vendor-BO-UU5I_.js";const p=()=>{const[o,i]=r.useState([]),e=r.useMemo(()=>["💒","💍","💐","❤️","💑","🎉","🥂","💕"],[]);r.useEffect(()=>{const t=[];for(let n=0;n<15;n++)t.push({id:Date.now()+n,emoji:e[Math.floor(Math.random()*e.length)],left:Math.random()*100,delay:Math.random()*5,duration:3+Math.random()*4});i(t);const s=setInterval(()=>{i(n=>[...n.slice(-19),{id:Date.now(),emoji:e[Math.floor(Math.random()*e.length)],left:Math.random()*100,delay:0,duration:3+Math.random()*4}])},800);return()=>clearInterval(s)},[e]);const d=r.useMemo(()=>[{name:"Connections",path:"/connections",description:"Find groups of four!"},{name:"The Mini",path:"/wedding-crossword",description:"Wedding crossword puzzle"},{name:"Wedding Strands",path:"/wedding-strands",description:"Find the hidden words"}],[]);return a.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 relative overflow-hidden",children:[a.jsx("div",{className:"fixed inset-0 pointer-events-none overflow-hidden",style:{zIndex:1},children:o.map(t=>a.jsx("div",{className:"absolute text-4xl animate-fall",style:{left:`${t.left}%`,animationDelay:`${t.delay}s`,animationDuration:`${t.duration}s`,top:"-60px"},children:t.emoji},t.id))}),a.jsxs("div",{className:"relative z-10 max-w-4xl mx-auto",children:[a.jsxs("div",{className:"text-center mb-12",children:[a.jsx("h1",{style:{fontSize:"clamp(2rem, 5vw, 3rem)",paddingTop:"60px"},className:"font-bold mb-2 animate-fadeIn text-gray-900 dark:text-gray-100",children:"Welcome to our wedding! 💕"}),a.jsx("p",{className:"text-2xl md:text-3xl text-gray-600 dark:text-gray-300 animate-fadeIn",style:{animationDelay:"0.3s"},children:"Sofia and Joel invite you to try some of our favourite puzzles with a wedding day twist!"})]}),a.jsx("div",{className:"grid md:grid-cols-3 gap-6 sm:gap-3 sm:scale-90 mt-16 sm:mt-8",children:d.map((t,s)=>a.jsxs(l,{to:t.path,className:`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 
                         p-6 sm:p-4 text-center transform hover:-translate-y-2 animate-fadeIn`,style:{animationDelay:`${.5+s*.2}s`},children:[a.jsx("h2",{className:"text-2xl sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors",children:t.name}),a.jsx("p",{className:"text-gray-600 dark:text-gray-300 text-base sm:text-sm",children:t.description}),a.jsx("div",{className:"mt-4 text-pink-500 dark:text-pink-400 group-hover:translate-x-2 transition-transform inline-block",children:"→"})]},t.path))}),a.jsx("div",{className:"text-center mt-16 text-6xl animate-fadeIn",style:{animationDelay:"1.1s"},children:"❤️ 💍 ❤️"})]}),a.jsx("style",{children:`
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

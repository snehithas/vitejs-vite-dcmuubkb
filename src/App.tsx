// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const DAILY_SECTION_LIMIT = 4;
const PRIME_HUNTER_COST = 300;   // XP to unlock Prime Hunter (permanent)
const SLITHER_COST = 600;        // XP to unlock Slither
const LIVE_MODE_COST = 400;      // XP to unlock Live Mode
const APEX_COST = 15;            // LC per Apex Coach query

// Game time (earned by math)
const MINS_PER_SECTION = 3;
const MINS_PER_BOUNTY_CORRECT = 2;
const MAX_GAME_MINS = 30;
const GAME_TIME_LIMIT_MS = MAX_GAME_MINS * 60 * 1000;

// XP values
const SECTION_XP = 35;
const CHALLENGE_XP = 50;
const PROOF_PASS_XP = 20;
const BOUNTY_XP = 25;
const BOUNTY_DAILY_CAP = 15;
const LEARN_XP = 20;             // XP per correct in Learn Mode (deep understanding)
const LIVE_XP = 5;               // XP per correct in Live Mode (demonstration)
const LIVE_FLUX = 30;            // Flux per correct in Live Mode
const LEARN_FLUX = 5;            // Flux per correct in Learn Mode
const BOUNTY_FLUX = 15;          // Flux per correct bounty answer
const SECTION_FLUX = 10;         // Flux per section synced

// LC costs
const HINT_COST = 3;
const REVEAL_COST = 5;
const SCAFFOLD_COST = 3;         // Learn Mode scaffold help
const WORKED_EXAMPLE_COST = 8;   // Learn Mode worked example

// Bi-weekly test
const TEST_INTERVAL_DAYS = 14;

// Rank thresholds
const RANKS=[
  {name:"RECRUIT",  min:0,    color:"#8899aa"},
  {name:"OPERATIVE",min:300,  color:"#00aaff"},
  {name:"SPECIALIST",min:700, color:"#00ffcc"},
  {name:"VANGUARD", min:1500, color:"#ffdd00"},
  {name:"APEX",     min:3000, color:"#ff8800"},
  {name:"LEGEND",   min:6000, color:"#ff44cc"},
];
function getRank(xp){return [...RANKS].reverse().find(r=>xp>=r.min)||RANKS[0];}
function getNextRank(xp){return RANKS.find(r=>r.min>xp)||null;}

// Default rewards (parent editable)
const DEFAULT_REWARDS=[
  {id:"tv15",  label:"15 min TV",          flux:200, emoji:"📺", category:"tv"},
  {id:"tv45",  label:"45 min TV",          flux:500, emoji:"📺", category:"tv"},
  {id:"tv60",  label:"60 min TV",          flux:650, emoji:"📺", category:"tv"},
  {id:"vg30",  label:"30 min Video Games", flux:300, emoji:"🎮", category:"games"},
  {id:"vg60",  label:"1 hr Video Games",   flux:550, emoji:"🎮", category:"games"},
  {id:"rest",  label:"Choose Restaurant",  flux:800, emoji:"🍕", category:"outing"},
  {id:"poke",  label:"Pokemon Pack",       flux:1000,emoji:"🃏", category:"special"},
];

// Storage — v7 migrates from v6 automatically
const STORAGE_KEY = "vanguard_v7";
const STORAGE_KEY_V6 = "vanguard_v6";
const PARENT_PIN = "1234";

// ═══════════════════════════════════════════════════════════
// AoPS CURRICULUM — Real chapters + sections
// ═══════════════════════════════════════════════════════════
const CURRICULUM = [
  {
    id: "alg", code: "ALG-I", color: "#00ffcc",
    name: "Introduction to Algebra",
    chapters: [
      { id:"a1", num:"1", name:"Follow the Rules", sections:[
        {id:"a1s1",num:"1.1",name:"Numbers"},
        {id:"a1s2",num:"1.2",name:"Order of Operations"},
        {id:"a1s3",num:"1.3",name:"When Does Order Matter?"},
        {id:"a1s4",num:"1.4",name:"Distribution and Factoring"},
        {id:"a1s5",num:"1.5",name:"Equations"},
        {id:"a1s6",num:"1.6",name:"Exponents"},
        {id:"a1s7",num:"1.7",name:"Fractional Exponents"},
        {id:"a1s8",num:"1.8",name:"Radicals"},
      ]},
      { id:"a2", num:"2", name:"x Marks the Spot", sections:[
        {id:"a2s1",num:"2.1",name:"Expressions"},
        {id:"a2s2",num:"2.2",name:"Arithmetic with Expressions"},
        {id:"a2s3",num:"2.3",name:"Distribution, Subtraction, and Factoring"},
        {id:"a2s4",num:"2.4",name:"Fractions"},
      ]},
      { id:"a3", num:"3", name:"One-Variable Linear Equations", sections:[
        {id:"a3s1",num:"3.1",name:"Solving Linear Equations I"},
        {id:"a3s2",num:"3.2",name:"Solving Linear Equations II"},
        {id:"a3s3",num:"3.3",name:"Word Problems"},
        {id:"a3s4",num:"3.4",name:"Linear Equations in Disguise"},
      ]},
      { id:"a4", num:"4", name:"More Variables", sections:[
        {id:"a4s1",num:"4.1",name:"Evaluating Multi-Variable Expressions"},
        {id:"a4s2",num:"4.2",name:"Still More Arithmetic"},
        {id:"a4s3",num:"4.3",name:"Distribution and Factoring"},
        {id:"a4s4",num:"4.4",name:"Fractions"},
        {id:"a4s5",num:"4.5",name:"Equations"},
      ]},
      { id:"a5", num:"5", name:"Multi-Variable Linear Equations", sections:[
        {id:"a5s1",num:"5.1",name:"Two-Variable Linear Equations"},
        {id:"a5s2",num:"5.2",name:"Substitution"},
        {id:"a5s3",num:"5.3",name:"Elimination"},
        {id:"a5s4",num:"5.4",name:"Word Problems"},
        {id:"a5s5",num:"5.5",name:"More Linear Equations in Disguise"},
        {id:"a5s6",num:"5.6",name:"More Variables"},
      ]},
      { id:"a6", num:"6", name:"Ratios and Percents", sections:[
        {id:"a6s1",num:"6.1",name:"Basic Ratio Problems"},
        {id:"a6s2",num:"6.2",name:"More Challenging Ratio Problems"},
        {id:"a6s3",num:"6.3",name:"Conversion Factors"},
        {id:"a6s4",num:"6.4",name:"Percent"},
        {id:"a6s5",num:"6.5",name:"Percentage Problems"},
      ]},
      { id:"a7", num:"7", name:"Proportion", sections:[
        {id:"a7s1",num:"7.1",name:"Direct Proportion"},
        {id:"a7s2",num:"7.2",name:"Inverse Proportion"},
        {id:"a7s3",num:"7.3",name:"Joint Proportion"},
        {id:"a7s4",num:"7.4",name:"Rate Problems"},
      ]},
      { id:"a8", num:"8", name:"Graphing Lines", sections:[
        {id:"a8s1",num:"8.1",name:"Number Line and Cartesian Plane"},
        {id:"a8s2",num:"8.2",name:"Introduction to Graphing Linear Equations"},
        {id:"a8s3",num:"8.3",name:"Using Slope in Problems"},
        {id:"a8s4",num:"8.4",name:"Find the Equation"},
        {id:"a8s5",num:"8.5",name:"Slope and Intercepts"},
        {id:"a8s6",num:"8.6",name:"Comparing Lines"},
      ]},
      { id:"a9", num:"9", name:"Introduction to Inequalities", sections:[
        {id:"a9s1",num:"9.1",name:"The Basics"},
        {id:"a9s2",num:"9.2",name:"Which Is Greater?"},
        {id:"a9s3",num:"9.3",name:"Linear Inequalities"},
        {id:"a9s4",num:"9.4",name:"Graphing Inequalities"},
        {id:"a9s5",num:"9.5",name:"Optimization"},
      ]},
      { id:"a10", num:"10", name:"Quadratic Equations – Part 1", sections:[
        {id:"a10s1",num:"10.1",name:"Getting Started With Quadratics"},
        {id:"a10s2",num:"10.2",name:"Factoring Quadratics I"},
        {id:"a10s3",num:"10.3",name:"Factoring Quadratics II"},
        {id:"a10s4",num:"10.4",name:"Sums and Products of Roots"},
        {id:"a10s5",num:"10.5",name:"Extensions and Applications"},
      ]},
      { id:"a11", num:"11", name:"Special Factorizations", sections:[
        {id:"a11s1",num:"11.1",name:"Squares of Binomials"},
        {id:"a11s2",num:"11.2",name:"Difference of Squares"},
        {id:"a11s3",num:"11.3",name:"Sum and Difference of Cubes"},
        {id:"a11s4",num:"11.4",name:"Rationalizing Denominators"},
        {id:"a11s5",num:"11.5",name:"Simon's Favorite Factoring Trick"},
      ]},
      { id:"a12", num:"12", name:"Complex Numbers", sections:[
        {id:"a12s1",num:"12.1",name:"Numbers, Numbers, and More Numbers!"},
        {id:"a12s2",num:"12.2",name:"Imaginary Numbers"},
        {id:"a12s3",num:"12.3",name:"Complex Numbers"},
      ]},
      { id:"a13", num:"13", name:"Quadratic Equations – Part 2", sections:[
        {id:"a13s1",num:"13.1",name:"Squares of Binomials Revisited"},
        {id:"a13s2",num:"13.2",name:"Completing the Square"},
        {id:"a13s3",num:"13.3",name:"The Quadratic Formula"},
        {id:"a13s4",num:"13.4",name:"Applications and Extensions"},
      ]},
      { id:"a14", num:"14", name:"Graphing Quadratics", sections:[
        {id:"a14s1",num:"14.1",name:"Parabolas"},
        {id:"a14s2",num:"14.2",name:"Circles"},
      ]},
      { id:"a15", num:"15", name:"More Inequalities", sections:[
        {id:"a15s1",num:"15.1",name:"Quadratic Inequalities"},
        {id:"a15s2",num:"15.2",name:"Beyond Quadratics"},
        {id:"a15s3",num:"15.3",name:"The Trivial Inequality"},
        {id:"a15s4",num:"15.4",name:"Quadratic Optimization"},
      ]},
      { id:"a16", num:"16", name:"Functions", sections:[
        {id:"a16s1",num:"16.1",name:"The Machine"},
        {id:"a16s2",num:"16.2",name:"Combining Functions"},
        {id:"a16s3",num:"16.3",name:"Composition"},
        {id:"a16s4",num:"16.4",name:"Inverse Functions"},
        {id:"a16s5",num:"16.5",name:"Problem Solving with Functions"},
      ]},
      { id:"a17", num:"17", name:"Graphing Functions", sections:[
        {id:"a17s1",num:"17.1",name:"Basics of Graphing Functions"},
        {id:"a17s2",num:"17.2",name:"Transformations"},
        {id:"a17s3",num:"17.3",name:"Inverse Functions Revisited"},
      ]},
      { id:"a18", num:"18", name:"Polynomials", sections:[
        {id:"a18s1",num:"18.1",name:"Addition and Subtraction"},
        {id:"a18s2",num:"18.2",name:"Multiplication"},
      ]},
      { id:"a19", num:"19", name:"Exponents and Logarithms", sections:[
        {id:"a19s1",num:"19.1",name:"Exponential Functions"},
        {id:"a19s2",num:"19.2",name:"Show Me the Money"},
        {id:"a19s3",num:"19.3",name:"Interest–ing Problems"},
        {id:"a19s4",num:"19.4",name:"What is a Logarithm?"},
      ]},
      { id:"a20", num:"20", name:"Special Functions", sections:[
        {id:"a20s1",num:"20.1",name:"Radicals"},
        {id:"a20s2",num:"20.2",name:"Absolute Value"},
        {id:"a20s3",num:"20.3",name:"Floor and Ceiling"},
        {id:"a20s4",num:"20.4",name:"Rational Functions"},
        {id:"a20s5",num:"20.5",name:"Piecewise Defined Functions"},
      ]},
      { id:"a21", num:"21", name:"Sequences & Series", sections:[
        {id:"a21s1",num:"21.1",name:"Arithmetic Sequences"},
        {id:"a21s2",num:"21.2",name:"Arithmetic Series"},
        {id:"a21s3",num:"21.3",name:"Geometric Sequences"},
        {id:"a21s4",num:"21.4",name:"Geometric Series"},
      ]},
    ],
  },
  {
    id: "cp", code: "C&P", color: "#ff44cc",
    name: "Counting & Probability",
    chapters: [
      { id:"c1", num:"1", name:"Counting Is Arithmetic", sections:[
        {id:"c1s1",num:"1.1",name:"Introduction"},
        {id:"c1s2",num:"1.2",name:"Counting Lists of Numbers"},
        {id:"c1s3",num:"1.3",name:"Counting with Addition and Subtraction"},
        {id:"c1s4",num:"1.4",name:"Counting Multiple Events"},
        {id:"c1s5",num:"1.5",name:"Permutations"},
      ]},
      { id:"c2", num:"2", name:"Basic Counting Techniques", sections:[
        {id:"c2s1",num:"2.1",name:"Introduction"},
        {id:"c2s2",num:"2.2",name:"Casework"},
        {id:"c2s3",num:"2.3",name:"Complementary Counting"},
        {id:"c2s4",num:"2.4",name:"Constructive Counting"},
        {id:"c2s5",num:"2.5",name:"Counting with Restrictions"},
      ]},
      { id:"c3", num:"3", name:"Correcting for Overcounting", sections:[
        {id:"c3s1",num:"3.1",name:"Introduction"},
        {id:"c3s2",num:"3.2",name:"Permutations with Repeated Elements"},
        {id:"c3s3",num:"3.3",name:"Counting Pairs of Items"},
        {id:"c3s4",num:"3.4",name:"Counting with Symmetries"},
      ]},
      { id:"c4", num:"4", name:"Committees and Combinations", sections:[
        {id:"c4s1",num:"4.1",name:"Introduction"},
        {id:"c4s2",num:"4.2",name:"Committee Forming"},
        {id:"c4s3",num:"4.3",name:"How to Compute Combinations"},
        {id:"c4s4",num:"4.4",name:"Our First Combinatorial Identity"},
      ]},
      { id:"c5", num:"5", name:"More With Combinations", sections:[
        {id:"c5s1",num:"5.1",name:"Introduction"},
        {id:"c5s2",num:"5.2",name:"Paths on a Grid"},
        {id:"c5s3",num:"5.3",name:"More Committee-type Problems"},
        {id:"c5s4",num:"5.4",name:"Distinguishability"},
      ]},
      { id:"c7", num:"7", name:"Introduction to Probability", sections:[
        {id:"c7s1",num:"7.1",name:"Introduction"},
        {id:"c7s2",num:"7.2",name:"Basic Probability"},
        {id:"c7s3",num:"7.3",name:"Equally Likely Outcomes"},
        {id:"c7s4",num:"7.4",name:"Counting Techniques in Probability"},
      ]},
      { id:"c8", num:"8", name:"Basic Probability Techniques", sections:[
        {id:"c8s1",num:"8.1",name:"Introduction"},
        {id:"c8s2",num:"8.2",name:"Probability and Addition"},
        {id:"c8s3",num:"8.3",name:"Complementary Probabilities"},
        {id:"c8s4",num:"8.4",name:"Probability and Multiplication"},
        {id:"c8s5",num:"8.5",name:"Probability with Dependent Events"},
      ]},
      { id:"c11", num:"11", name:"Pascal's Triangle", sections:[
        {id:"c11s1",num:"11.1",name:"Introduction"},
        {id:"c11s2",num:"11.2",name:"Pascal's Identity"},
        {id:"c11s3",num:"11.3",name:"The Hockey Stick Identity"},
        {id:"c11s4",num:"11.4",name:"Row Sums of Pascal's Triangle"},
      ]},
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// PROOF QUESTIONS (2–3 per section) + CHALLENGE (1 per section)
// ═══════════════════════════════════════════════════════════
const SECTION_PROOFS = {
  // ALG CH1
  a1s1:[
    {q:"Is −3 a natural number, integer, or both?",a:"integer",hint:"Natural numbers are positive"},
    {q:"What type of number is 0.333...?",a:"rational",hint:"It equals 1/3"},
  ],
  a1s2:[
    {q:"Evaluate: 3 + 4 × 2",a:"11",hint:"Multiply before adding"},
    {q:"Evaluate: (3+4) × 2",a:"14",hint:"Parentheses first"},
    {q:"Evaluate: 2³ + 10 ÷ 5",a:"10",hint:"Exponents before division before addition"},
  ],
  a1s3:[
    {q:"Does 5 − 3 = 3 − 5?",a:"no",hint:"Try calculating both sides"},
    {q:"Is addition commutative?",a:"yes",hint:"Does a+b always equal b+a?"},
    {q:"Is subtraction associative? (yes/no)",a:"no",hint:"Try (8−3)−2 vs 8−(3−2)"},
  ],
  a1s4:[
    {q:"Expand: 3(x + 4)",a:"3x+12",hint:"Multiply 3 by each term"},
    {q:"Factor: 6x + 10",a:"2(3x+5)",hint:"What's the GCF of 6 and 10?"},
    {q:"Expand: −2(x − 5)",a:"-2x+10",hint:"Distribute the −2 carefully"},
  ],
  a1s5:[
    {q:"Solve: x + 5 = 12",a:"7",hint:"Subtract 5 from both sides"},
    {q:"Solve: 3x = 18",a:"6",hint:"Divide both sides by 3"},
    {q:"Solve: 2x + 1 = 9",a:"4",hint:"Subtract 1, then divide by 2"},
  ],
  a1s6:[
    {q:"What is 2⁴?",a:"16",hint:"2×2×2×2"},
    {q:"Simplify: x³ · x⁵",a:"x^8",hint:"Add the exponents"},
    {q:"What is (3²)³?",a:"729",hint:"Multiply exponents, then evaluate"},
  ],
  a1s7:[
    {q:"What is 8^(1/3)?",a:"2",hint:"Cube root of 8"},
    {q:"Simplify: x^(1/2) · x^(1/2)",a:"x",hint:"Add the fractional exponents"},
    {q:"What is 4^(3/2)?",a:"8",hint:"(4^(1/2))^3 = 2^3"},
  ],
  a1s8:[
    {q:"Simplify: √12",a:"2√3",hint:"√4 · √3 = 2√3"},
    {q:"Simplify: √18",a:"3√2",hint:"√9 · √2"},
    {q:"What is √(-4)? (type imaginary or real)",a:"imaginary",hint:"Can't take square root of a negative (in reals)"},
  ],
  // ALG CH2
  a2s1:[
    {q:"Evaluate 3x − y when x=2, y=4",a:"2",hint:"3(2)−4"},
    {q:"What is the value of x²+1 when x=−3?",a:"10",hint:"(−3)²+1"},
  ],
  a2s2:[
    {q:"Simplify: 3x + 2x",a:"5x",hint:"Combine like terms"},
    {q:"Simplify: 4x + 3y − x + 2y",a:"3x+5y",hint:"Group x terms and y terms"},
  ],
  a2s3:[
    {q:"Expand: −(x − 4)",a:"-x+4",hint:"Distribute the negative sign"},
    {q:"Factor: 4x − 8",a:"4(x-2)",hint:"Pull out GCF = 4"},
    {q:"Expand: (x+1)(x+2)",a:"x^2+3x+2",hint:"Use FOIL"},
  ],
  a2s4:[
    {q:"Simplify: (2x)/4",a:"x/2",hint:"Divide numerator and denominator by 2"},
    {q:"Add: x/2 + x/3",a:"5x/6",hint:"Common denominator is 6"},
  ],
  // ALG CH3
  a3s1:[
    {q:"Solve: x − 7 = 3",a:"10",hint:"Add 7 to both sides"},
    {q:"Solve: x/3 = 9",a:"27",hint:"Multiply both sides by 3"},
  ],
  a3s2:[
    {q:"Solve: 5x − 3 = 17",a:"4",hint:"Add 3, divide by 5"},
    {q:"Solve: 2(x+1) = 10",a:"4",hint:"Distribute first or divide by 2 first"},
    {q:"Solve: 3x + 4 = x + 12",a:"4",hint:"Move variables to one side"},
  ],
  a3s3:[
    {q:"The sum of two numbers is 30 and one is twice the other. Find the smaller number.",a:"10",hint:"x + 2x = 30"},
    {q:"A number increased by 8 equals 21. What is the number?",a:"13",hint:"n + 8 = 21"},
  ],
  a3s4:[
    {q:"Solve: 1/(x+1) = 1/4",a:"3",hint:"Cross-multiply"},
    {q:"Solve: (x+2)/3 = (x−1)/2",a:"8",hint:"Cross-multiply and solve"},
  ],
  // ALG CH4
  a4s1:[
    {q:"Evaluate: 2a − 3b when a=5, b=2",a:"4",hint:"2(5)−3(2)"},
    {q:"Evaluate: xy − x when x=3, y=4",a:"9",hint:"(3)(4)−3"},
  ],
  a4s2:[
    {q:"Simplify: 3x²y + 2x²y",a:"5x^2y",hint:"Like terms must match exactly"},
    {q:"Simplify: 5ab − 2ab + ab",a:"4ab",hint:"Treat ab as one unit"},
  ],
  a4s3:[
    {q:"Expand: a(b + c)",a:"ab+ac",hint:"Distribute a to both terms"},
    {q:"Factor: 6xy + 9xz",a:"3x(2y+3z)",hint:"GCF is 3x"},
  ],
  a4s4:[
    {q:"Simplify: (6xy)/(3x)",a:"2y",hint:"Cancel common factors"},
    {q:"Add: 1/x + 1/y",a:"(x+y)/(xy)",hint:"Common denominator is xy"},
  ],
  a4s5:[
    {q:"Solve for y: 2x + y = 10",a:"y=10-2x",hint:"Subtract 2x from both sides"},
    {q:"Solve for x: ax = b",a:"x=b/a",hint:"Divide both sides by a"},
  ],
  // ALG CH5
  a5s1:[
    {q:"Is (2,3) a solution to x + y = 5?",a:"yes",hint:"2+3=?"},
    {q:"How many solutions does x + y = 10 have?",a:"infinite",hint:"Any point on the line works"},
  ],
  a5s2:[
    {q:"Solve: y = 2x and x + y = 6. Find x.",a:"2",hint:"Replace y with 2x in the second equation"},
    {q:"Solve: x = 3 and 2x + y = 11. Find y.",a:"5",hint:"Substitute x=3 directly"},
  ],
  a5s3:[
    {q:"Solve: x+y=7 and x−y=3. Find x.",a:"5",hint:"Add the two equations"},
    {q:"Solve: 2x+y=11 and x+y=7. Find x.",a:"4",hint:"Subtract the second from the first"},
  ],
  a5s4:[
    {q:"Two numbers sum to 40 and differ by 8. Find the larger.",a:"24",hint:"x+y=40, x-y=8"},
    {q:"Tickets cost $5 for kids and $8 for adults. 10 tickets sold for $62. How many adult tickets?",a:"4",hint:"k+a=10, 5k+8a=62"},
  ],
  a5s5:[
    {q:"Solve: 1/x + 1/y = 1/2 and x=y. Find x.",a:"4",hint:"Substitute x=y and solve"},
  ],
  a5s6:[
    {q:"Solve: x+y+z=6, x=1, y=2. Find z.",a:"3",hint:"Substitute x and y"},
  ],
  // ALG CH6
  a6s1:[
    {q:"A ratio is 3:5. If the first quantity is 12, what is the second?",a:"20",hint:"3/5 = 12/x"},
    {q:"Simplify ratio 18:24.",a:"3:4",hint:"Divide both by GCF=6"},
  ],
  a6s2:[
    {q:"In a class of 30, ratio of boys to girls is 2:3. How many girls?",a:"18",hint:"Girls = 3/5 × 30"},
    {q:"A recipe needs 2 cups flour per 3 cups milk. For 9 cups milk, how much flour?",a:"6",hint:"Set up proportion"},
  ],
  a6s3:[
    {q:"Convert 60 mph to feet per second. (1 mile = 5280 ft)",a:"88",hint:"60×5280/3600"},
    {q:"Convert 2 meters to centimeters.",a:"200",hint:"1 meter = 100 cm"},
  ],
  a6s4:[
    {q:"What is 40% of 80?",a:"32",hint:"0.4 × 80"},
    {q:"15 is what percent of 60?",a:"25",hint:"15/60 × 100"},
  ],
  a6s5:[
    {q:"A $50 item is on sale for 20% off. Sale price?",a:"40",hint:"50 × 0.80"},
    {q:"After a 10% increase, a price is $66. Original price?",a:"60",hint:"x × 1.1 = 66"},
  ],
  // ALG CH7
  a7s1:[
    {q:"If y varies directly with x and y=6 when x=2, find y when x=5.",a:"15",hint:"y/x = constant = 3"},
    {q:"Write the direct proportion equation if y=4x.",a:"y=4x",hint:"Direct proportion: y=kx"},
  ],
  a7s2:[
    {q:"If y varies inversely with x and y=6 when x=2, find y when x=3.",a:"4",hint:"xy = constant = 12"},
    {q:"If y inversely varies with x and y=10 when x=5, find y when x=25.",a:"2",hint:"xy = 50"},
  ],
  a7s3:[
    {q:"z varies jointly with x and y. If z=12 when x=2 and y=3, find the constant k.",a:"2",hint:"z=kxy → 12=k(2)(3)"},
  ],
  a7s4:[
    {q:"Train travels 150 miles in 3 hours. Speed?",a:"50",hint:"speed = distance/time"},
    {q:"At 60 mph, how long to travel 240 miles?",a:"4",hint:"time = distance/speed"},
  ],
  // ALG CH8
  a8s1:[
    {q:"What is the distance from (0,0) to (3,4)?",a:"5",hint:"√(3²+4²)"},
    {q:"What is the midpoint of (0,0) and (4,6)?",a:"(2,3)|2,3",hint:"Average the x and y coordinates separately"},
  ],
  a8s2:[
    {q:"Does (2,4) lie on y = 2x?",a:"yes",hint:"Plug in: 4 = 2(2)?"},
    {q:"What is the y-intercept of y = 3x − 5?",a:"-5",hint:"Set x=0"},
  ],
  a8s3:[
    {q:"What is the slope between (1,2) and (3,8)?",a:"3",hint:"(8−2)/(3−1)"},
    {q:"A line rises 4 units for every 2 horizontal. Slope?",a:"2",hint:"rise/run = 4/2"},
  ],
  a8s4:[
    {q:"Find the equation of a line with slope 2 through (0,3).",a:"y=2x+3",hint:"y=mx+b form"},
    {q:"Find the equation through (1,5) with slope 3.",a:"y=3x+2",hint:"Use point-slope: y−5=3(x−1)"},
  ],
  a8s5:[
    {q:"What is the slope of y = −4x + 7?",a:"-4",hint:"y=mx+b, m is the slope"},
    {q:"What is the x-intercept of y = 2x − 6?",a:"3",hint:"Set y=0 and solve"},
  ],
  a8s6:[
    {q:"Are y=2x+1 and y=2x+5 parallel?",a:"yes",hint:"Same slope means parallel"},
    {q:"What is the slope of a line perpendicular to y=3x+1?",a:"-1/3",hint:"Perpendicular slopes multiply to −1"},
  ],
  // ALG CH9
  a9s1:[
    {q:"Is x=5 a solution to x > 3?",a:"yes",hint:"Is 5 > 3?"},
    {q:"Write using inequality: x is at most 7.",a:"x≤7",hint:"At most means ≤"},
  ],
  a9s2:[
    {q:"Which is greater: −3 or −5?",a:"-3",hint:"On a number line, further right is greater"},
    {q:"Is 1/3 > 1/4?",a:"yes",hint:"Same numerator, smaller denominator = larger fraction"},
  ],
  a9s3:[
    {q:"Solve: 3x − 2 > 7",a:"x>3",hint:"Add 2, then divide by 3"},
    {q:"Solve: −2x < 8",a:"x>-4",hint:"Flip the inequality when dividing by negative!"},
    {q:"Solve: 4 − x ≤ 2",a:"x≥2",hint:"Subtract 4, then flip sign"},
  ],
  a9s4:[
    {q:"Graph x > 2 — open or closed circle at 2?",a:"open",hint:"Strict inequality uses open circle"},
    {q:"Graph x ≤ 5 — open or closed circle at 5?",a:"closed",hint:"≤ includes the endpoint"},
  ],
  a9s5:[
    {q:"Maximize 3x+2y subject to x+y≤4, x≥0, y≥0. Maximum value?",a:"12",hint:"Try corner points: (4,0)→12, (0,4)→8"},
  ],
  // ALG CH10
  a10s1:[
    {q:"Solve x² = 25.",a:"x=5,x=-5|x=±5",hint:"Take ±√25"},
    {q:"What is a quadratic equation? (answer: degree 2)",a:"degree 2|2nd degree",hint:"The highest power of x is..."},
  ],
  a10s2:[
    {q:"Factor: x² + 7x + 12",a:"(x+3)(x+4)",hint:"Find two numbers × to 12, + to 7"},
    {q:"Factor: x² − 5x + 6",a:"(x-2)(x-3)",hint:"Find two numbers × to 6, + to −5"},
  ],
  a10s3:[
    {q:"Factor: 2x² + 7x + 3",a:"(2x+1)(x+3)",hint:"Multiply a×c=6, find factors adding to 7"},
    {q:"Factor: 3x² − 10x − 8",a:"(3x+2)(x-4)",hint:"a×c=−24, find factors adding to −10"},
  ],
  a10s4:[
    {q:"For x²−5x+6=0, what is the sum of roots?",a:"5",hint:"Sum of roots = −b/a = 5/1"},
    {q:"For x²−5x+6=0, what is the product of roots?",a:"6",hint:"Product of roots = c/a = 6/1"},
  ],
  a10s5:[
    {q:"Solve x² − 4 = 0.",a:"x=2,x=-2|x=±2",hint:"x²=4 → x=±2"},
  ],
  // ALG CH11
  a11s1:[
    {q:"Expand: (x+3)²",a:"x^2+6x+9",hint:"(a+b)²=a²+2ab+b²"},
    {q:"Expand: (x−4)²",a:"x^2-8x+16",hint:"(a−b)²=a²−2ab+b²"},
  ],
  a11s2:[
    {q:"Factor: x² − 16",a:"(x+4)(x-4)",hint:"a²−b²=(a+b)(a−b)"},
    {q:"Factor: 4x² − 9",a:"(2x+3)(2x-3)",hint:"(2x)²−3²"},
  ],
  a11s3:[
    {q:"Factor: x³ − 8 (type just the two factors)",a:"(x-2)(x^2+2x+4)|(x-2)(x²+2x+4)",hint:"a=x, b=2: (x-2)(x²+2x+4)"},
    {q:"Factor: x³ + 27 (type just the two factors)",a:"(x+3)(x^2-3x+9)|(x+3)(x²-3x+9)",hint:"a=x, b=3: (x+3)(x²−3x+9)"},
  ],
  a11s4:[
    {q:"Rationalize: 1/√2",a:"√2/2",hint:"Multiply by √2/√2"},
    {q:"Rationalize: 3/(1+√2)",a:"3(√2-1)|3√2-3",hint:"Multiply by conjugate (1−√2)/(1−√2)"},
  ],
  a11s5:[
    {q:"Factor: xy + x + y + 1",a:"(x+1)(y+1)",hint:"Group: x(y+1)+1(y+1)"},
  ],
  // ALG CH12
  a12s1:[
    {q:"What type of number is √−1?",a:"imaginary",hint:"It's defined as i"},
    {q:"Is every real number also a complex number?",a:"yes",hint:"Complex = a+bi, real means b=0"},
  ],
  a12s2:[
    {q:"What is i²?",a:"-1",hint:"By definition of i"},
    {q:"What is i³?",a:"-i",hint:"i³ = i² × i = −1 × i"},
    {q:"What is i⁴?",a:"1",hint:"i⁴ = (i²)² = (−1)² = 1"},
  ],
  a12s3:[
    {q:"Add: (3+2i) + (1−4i)",a:"4-2i",hint:"Add real parts, add imaginary parts"},
    {q:"Multiply: (2+i)(2−i)",a:"5",hint:"(a+b)(a−b)=a²−b², here 4−(−1)=5"},
    {q:"What is the conjugate of 3+4i?",a:"3-4i",hint:"Flip the sign of the imaginary part"},
  ],
  // ALG CH13
  a13s1:[
    {q:"What value completes the square: x²+6x+__ = (x+3)²?",a:"9",hint:"Add (6/2)²=9"},
    {q:"Write x²+10x+25 as a perfect square.",a:"(x+5)^2",hint:"Is this (x+5)²?"},
  ],
  a13s2:[
    {q:"Solve x²+4x−5=0 by completing the square.",a:"x=1,x=-5|x=-5,x=1",hint:"x²+4x+4=9 → (x+2)²=9"},
    {q:"Rewrite x²−8x by completing the square.",a:"(x-4)^2-16|(x-4)^2−16",hint:"Add and subtract (8/2)²=16: (x-4)²−16"},
  ],
  a13s3:[
    {q:"Use the quadratic formula to solve x²−5x+6=0.",a:"x=2,x=3|x=3,x=2",hint:"a=1,b=−5,c=6 → discriminant=1"},
    {q:"What is the discriminant of x²+2x+5=0?",a:"-16",hint:"b²−4ac = 4−20"},
  ],
  a13s4:[
    {q:"How many real solutions if discriminant = 0?",a:"1",hint:"One repeated root"},
    {q:"How many real solutions if discriminant < 0?",a:"0",hint:"Can't take square root of negative"},
  ],
  // ALG CH14
  a14s1:[
    {q:"What is the vertex of y = (x−3)² + 5?",a:"(3,5)",hint:"Vertex form: y=a(x−h)²+k, vertex=(h,k)"},
    {q:"Does y = x² open up or down?",a:"up",hint:"Positive leading coefficient opens upward"},
    {q:"What is the axis of symmetry of y = x² − 4x + 1?",a:"x=2",hint:"x = −b/(2a) = 4/2"},
  ],
  a14s2:[
    {q:"What is the center of (x−2)²+(y+3)²=25?",a:"(2,-3)",hint:"Center is (h,k) in (x−h)²+(y−k)²=r²"},
    {q:"What is the radius of x²+y²=16?",a:"4",hint:"r²=16 → r=4"},
  ],
  // ALG CH16
  a16s1:[
    {q:"Is f(x)=x² a function?",a:"yes",hint:"Each x maps to exactly one y"},
    {q:"Evaluate f(3) if f(x)=2x−1.",a:"5",hint:"2(3)−1"},
  ],
  a16s2:[
    {q:"If f(x)=x+1 and g(x)=2x, find (f+g)(3).",a:"10",hint:"f(3)+g(3) = 4+6"},
    {q:"If f(x)=x² and g(x)=x+1, find (fg)(2).",a:"12",hint:"f(2)·g(2) = 4·3"},
  ],
  a16s3:[
    {q:"If f(x)=2x and g(x)=x+3, find f(g(1)).",a:"8",hint:"g(1)=4, then f(4)=8"},
    {q:"If f(x)=x² and g(x)=x+1, find g(f(2)).",a:"5",hint:"f(2)=4, then g(4)=5"},
  ],
  a16s4:[
    {q:"What is the inverse of f(x) = 2x+1?",a:"(x-1)/2|x/2-1/2|x/2-.5|(x-1)/2",hint:"Swap x and y: x=2y+1, solve: y=(x-1)/2"},
    {q:"If f(3)=7, what does f⁻¹(7) equal?",a:"3",hint:"Inverse undoes the function"},
  ],
  a16s5:[
    {q:"If f(x)=x²+1, for which x does f(x)=5?",a:"x=2,x=-2|x=±2",hint:"x²+1=5 → x²=4"},
  ],
  // ALG CH21
  a21s1:[
    {q:"What is the 5th term of 3, 7, 11, 15, ...?",a:"19",hint:"Common difference = 4"},
    {q:"Find the common difference: 2, 9, 16, 23, ...",a:"7",hint:"9−2=7"},
    {q:"What is the nth term formula for 1, 4, 7, 10, ...?",a:"3n-2",hint:"a₁=1, d=3, aₙ=1+3(n−1)"},
  ],
  a21s2:[
    {q:"Sum of 1+2+3+...+10?",a:"55",hint:"n(n+1)/2 = 10(11)/2"},
    {q:"Sum of arithmetic sequence: a₁=3, d=2, n=5.",a:"35",hint:"S = n/2·(2a₁+(n−1)d) = 5/2·(6+8)"},
  ],
  a21s3:[
    {q:"What is the common ratio of 2, 6, 18, 54, ...?",a:"3",hint:"6/2=3"},
    {q:"What is the 4th term of 1, 2, 4, 8, ...?",a:"8",hint:"a₁=1, r=2, a₄=1·2³"},
    {q:"What is aₙ for geometric seq with a₁=5, r=2?",a:"5·2^(n-1)",hint:"aₙ = a₁·r^(n−1)"},
  ],
  a21s4:[
    {q:"Sum of geometric: a₁=1, r=2, n=4.",a:"15",hint:"S = a₁(rⁿ−1)/(r−1) = 1(16−1)/(2−1)"},
    {q:"Sum of geometric: a₁=3, r=1/2, n=3.",a:"21/4|5.25",hint:"S = 3(1−(1/2)³)/(1−1/2) = 3·7/8 ÷ 1/2"},
  ],
  // ALG CH15
  a15s1:[
    {q:"Solve x²−5x+6>0. (Write as two separate inequalities joined by 'or')",a:"x<2orx>3|x>3orx<2",hint:"Factor: (x-2)(x-3)>0, both positive or both negative"},
    {q:"For (x-1)(x-4)<0, is x=2 a solution?",a:"yes",hint:"(2-1)(2-4)=(1)(-2)=-2 < 0"},
  ],
  a15s2:[
    {q:"Solve x³>0 for positive x (yes/no: is x=2 a solution?)",a:"yes",hint:"2³=8>0"},
    {q:"How many real solutions does x²+1=0 have?",a:"0",hint:"x²=-1 has no real solutions"},
  ],
  a15s3:[
    {q:"The Trivial Inequality: for any real x, is x²≥0 always true?",a:"yes",hint:"Squaring any real number gives a non-negative result"},
    {q:"Use the Trivial Inequality: prove a²+b²≥2ab. What identity helps?",a:"(a-b)^2>=0|(a-b)^2",hint:"(a-b)²=a²-2ab+b²≥0 → a²+b²≥2ab"},
  ],
  a15s4:[
    {q:"Maximize f(x)=-(x-3)²+10. What is the maximum value?",a:"10",hint:"The vertex of -(x-3)²+10 is at (3,10)"},
    {q:"At which x does f(x)=-(x-3)²+10 reach its maximum?",a:"3",hint:"x=h in vertex form y=a(x-h)²+k"},
  ],
  // ALG CH17
  a17s1:[
    {q:"Does f(x)=x² pass the vertical line test?",a:"yes",hint:"Every x gives exactly one y"},
    {q:"What is the y-intercept of f(x)=3x²-2?",a:"-2",hint:"Set x=0: f(0)=-2"},
  ],
  a17s2:[
    {q:"How does y=f(x)+3 relate to y=f(x)?",a:"shift up 3|3 up|up 3",hint:"Adding to the output shifts the graph up"},
    {q:"How does y=f(x-2) relate to y=f(x)?",a:"shift right 2|right 2|2 right",hint:"Replacing x with x-2 shifts right"},
    {q:"How does y=-f(x) relate to y=f(x)?",a:"reflect over x-axis|flip over x|x-axis reflection",hint:"Negating the output flips the graph vertically"},
  ],
  a17s3:[
    {q:"If f and f⁻¹ are inverse functions, what is f(f⁻¹(x))?",a:"x",hint:"By definition, inverse functions undo each other"},
    {q:"Graphically, f⁻¹ is the reflection of f over which line?",a:"y=x",hint:"The line y=x is the mirror for inverse functions"},
  ],
  // ALG CH18
  a18s1:[
    {q:"Add: (3x²+2x+1)+(x²-x+4)",a:"4x^2+x+5|4x²+x+5",hint:"Combine like terms: 3x²+x²=4x², 2x-x=x, 1+4=5"},
    {q:"Subtract: (5x²+3x)-(2x²+x-1)",a:"3x^2+2x+1|3x²+2x+1",hint:"Distribute the negative: 5x²-2x²=3x², 3x-x=2x, 0+1=1"},
  ],
  a18s2:[
    {q:"Multiply: (x+2)(x²+x+1)",a:"x^3+3x^2+3x+2|x³+3x²+3x+2",hint:"Distribute x: x³+x²+x, distribute 2: 2x²+2x+2, combine"},
    {q:"What is the degree of (x²+1)(x³+x)?",a:"5",hint:"Degree of product = sum of degrees: 2+3=5"},
  ],
  // ALG CH19
  a19s1:[
    {q:"For f(x)=2^x, what is f(3)?",a:"8",hint:"2³=8"},
    {q:"Is f(x)=2^x increasing or decreasing?",a:"increasing",hint:"As x grows, 2^x grows larger"},
  ],
  a19s2:[
    {q:"$100 at 5% annual interest for 2 years (simple). Final amount?",a:"110",hint:"Simple: A=P(1+rt)=100(1+0.05×2)=110"},
    {q:"$1000 at 10% for 1 year compounded annually. Final amount?",a:"1100",hint:"A=1000(1.10)^1=1100"},
  ],
  a19s3:[
    {q:"Compound interest formula: A=P(1+r/n)^(nt). What does n represent?",a:"compoundings per year|number of compoundings|times compounded",hint:"n is how many times per year interest is compounded"},
    {q:"$500 compounded continuously at rate r=0.06 for 1 year: A=500e^0.06. Approximately what is e^0.06? (use 1.0618)",a:"530.9|530.90|531",hint:"500×1.0618≈530.9"},
  ],
  a19s4:[
    {q:"log₂(8)=?",a:"3",hint:"2³=8"},
    {q:"log₁₀(100)=?",a:"2",hint:"10²=100"},
    {q:"If log_b(x)=y, then b^y=?",a:"x",hint:"That's the definition of logarithm"},
  ],
  // ALG CH20
  a20s1:[
    {q:"Simplify: √(x²) for x≥0",a:"x",hint:"The square root of x² is x (when x is non-negative)"},
    {q:"Solve: √x = 4",a:"16",hint:"Square both sides: x=16"},
  ],
  a20s2:[
    {q:"What is |−7|?",a:"7",hint:"Absolute value is always non-negative"},
    {q:"Solve: |x|=5",a:"x=5,x=-5|x=±5",hint:"x=5 or x=-5"},
    {q:"Solve: |x-3|=2",a:"x=5,x=1|x=1,x=5",hint:"x-3=2 or x-3=-2"},
  ],
  a20s3:[
    {q:"What is ⌊3.7⌋ (floor)?",a:"3",hint:"Floor rounds down to nearest integer"},
    {q:"What is ⌈2.1⌉ (ceiling)?",a:"3",hint:"Ceiling rounds up to nearest integer"},
  ],
  a20s4:[
    {q:"Where is f(x)=1/x undefined?",a:"x=0|0",hint:"Division by zero is undefined"},
    {q:"What is the horizontal asymptote of f(x)=1/x?",a:"y=0",hint:"As x→∞, 1/x→0"},
  ],
  a20s5:[
    {q:"Evaluate f(x) = {x+1 if x>0, x-1 if x≤0} at x=3",a:"4",hint:"x=3>0, so use x+1=4"},
    {q:"Evaluate the same function at x=-2",a:"-3",hint:"x=-2≤0, so use x-1=-3"},
  ],
  // C&P CH1
  c1s1:[
    {q:"How many integers are from 1 to 50 inclusive?",a:"50",hint:"50−1+1=50"},
    {q:"How many even numbers are from 2 to 20?",a:"10",hint:"(20−2)/2 + 1"},
  ],
  c1s2:[
    {q:"How many integers from 13 to 27 inclusive?",a:"15",hint:"27−13+1"},
    {q:"How many multiples of 5 from 10 to 50?",a:"9",hint:"(50−10)/5 + 1"},
  ],
  c1s3:[
    {q:"A set has 15 boys and 12 girls. How many total?",a:"27",hint:"Simply add"},
    {q:"How many integers 1–30 are NOT multiples of 3?",a:"20",hint:"30 − 10 = 20 (there are 10 multiples of 3)"},
  ],
  c1s4:[
    {q:"You choose a shirt (3 options) and pants (4 options). How many outfits?",a:"12",hint:"Multiplication Principle: 3×4"},
    {q:"A coin is flipped and a die is rolled. How many outcomes?",a:"12",hint:"2×6"},
  ],
  c1s5:[
    {q:"How many ways to arrange 4 books on a shelf?",a:"24",hint:"4! = 4×3×2×1"},
    {q:"How many 3-digit numbers using digits 1,2,3 (no repeats)?",a:"6",hint:"3×2×1"},
    {q:"What is 5!?",a:"120",hint:"5×4×3×2×1"},
  ],
  // C&P CH2
  c2s1:[
    {q:"How many ways to distribute 3 distinct balls into 2 labeled boxes?",a:"8",hint:"Each ball has 2 choices: 2³"},
  ],
  c2s2:[
    {q:"Count integers 1–20 divisible by 2 or 3.",a:"13",hint:"Divisible by 2: 10; by 3: 6; by 6: 3. Use inclusion-exclusion."},
    {q:"Passwords: 1 uppercase + 1 digit. Uppercase: 26 options. Digits: 10. How many total 2-character passwords?",a:"260",hint:"26×10"},
  ],
  c2s3:[
    {q:"Integers 1–20 NOT divisible by 4?",a:"15",hint:"20 − (# divisible by 4) = 20−5"},
    {q:"How many 2-digit numbers don't have a 7?",a:"72",hint:"Total 2-digit: 90. With 7: 18. 90−18=72"},
  ],
  c2s4:[
    {q:"4-digit numbers with first digit non-zero. How many?",a:"9000",hint:"9×10×10×10"},
    {q:"License plates: 3 letters then 3 digits. How many?",a:"17576000",hint:"26³×10³"},
  ],
  c2s5:[
    {q:"How many 3-letter arrangements of A,B,C,D,E with no repeats?",a:"60",hint:"5×4×3"},
    {q:"How many 4-digit numbers with all different digits?",a:"4536",hint:"9×9×8×7"},
  ],
  // C&P CH3
  c3s1:[
    {q:"How many ways to arrange the letters in NOON?",a:"6",hint:"4!/2!/2!"},
    {q:"How many ways to arrange MISSISSIPPI (11 letters, M:1,I:4,S:4,P:2)?",a:"34650",hint:"11!/(4!4!2!)"},
  ],
  c3s2:[
    {q:"How many arrangements of AABB?",a:"6",hint:"4!/(2!2!)"},
    {q:"How many arrangements of ABCAB?",a:"30",hint:"5!/(2!2!)"},
  ],
  c3s3:[
    {q:"How many ways to choose 2 students from a class of 5?",a:"10",hint:"C(5,2)=5!/(2!3!)"},
    {q:"C(6,2)=?",a:"15",hint:"6×5/2"},
  ],
  c3s4:[
    {q:"A necklace has 5 beads. How many distinct arrangements (rotations identical)?",a:"12",hint:"(5−1)!/2 for necklace (reflections too)"},
    {q:"Seat 4 people at a round table (rotations identical). How many arrangements?",a:"6",hint:"(4−1)! = 3! = 6"},
  ],
  // C&P CH4
  c4s1:[
    {q:"C(5,2)=?",a:"10",hint:"5!/(2!3!)"},
    {q:"C(n,0)=?",a:"1",hint:"There's only one way to choose nothing"},
  ],
  c4s2:[
    {q:"A committee of 3 from 7 people. How many ways?",a:"35",hint:"C(7,3)"},
    {q:"A committee of 4 from 8 people. How many ways?",a:"70",hint:"C(8,4)"},
  ],
  c4s3:[
    {q:"C(8,3)=?",a:"56",hint:"8×7×6/(3×2×1)"},
    {q:"C(10,7)=?",a:"120",hint:"C(10,7)=C(10,3)=10×9×8/6"},
  ],
  c4s4:[
    {q:"C(n,k)+C(n,k+1)=?",a:"C(n+1,k+1)",hint:"Pascal's Identity"},
    {q:"C(5,0)+C(5,1)+C(5,2)+C(5,3)+C(5,4)+C(5,5)=?",a:"32",hint:"Sum of row n = 2ⁿ"},
  ],
  // C&P CH5
  c5s1:[
    {q:"C(n,k) = C(n, ?)",a:"n-k",hint:"C(n,k) = C(n,n−k) by symmetry"},
  ],
  c5s2:[
    {q:"Paths from (0,0) to (3,2) using only right/up steps?",a:"10",hint:"C(5,2) = 10"},
    {q:"Paths from (0,0) to (4,3)?",a:"35",hint:"C(7,3)"},
  ],
  c5s3:[
    {q:"Choose 3 from 5 boys and 2 from 4 girls. Ways?",a:"60",hint:"C(5,3)×C(4,2) = 10×6"},
    {q:"Committee of 4 from 6 men and 5 women with exactly 2 women?",a:"90",hint:"C(5,2)×C(6,2) = 10×15"},
  ],
  c5s4:[
    {q:"How many ways to split 6 people into 2 unlabeled groups of 3?",a:"10",hint:"C(6,3)/2 = 20/2"},
    {q:"4 identical balls into 3 labeled boxes (0 or more per box). Ways?",a:"15",hint:"C(4+2,2) = C(6,2) = 15 (stars and bars)"},
  ],
  // C&P CH7
  c7s1:[
    {q:"Probability is always between what two values?",a:"0 and 1|0,1",hint:"0 = impossible, 1 = certain"},
    {q:"P(A) + P(not A) = ?",a:"1",hint:"Complement rule"},
  ],
  c7s2:[
    {q:"P(rolling a 4 on a fair die)?",a:"1/6",hint:"1 favorable out of 6 equally likely"},
    {q:"P(flipping heads on a fair coin)?",a:"1/2",hint:"1 out of 2 outcomes"},
  ],
  c7s3:[
    {q:"A bag has 3 red and 2 blue marbles. P(red)?",a:"3/5",hint:"3 red out of 5 total"},
    {q:"P(drawing a heart from standard deck)?",a:"1/4",hint:"13 hearts out of 52"},
  ],
  c7s4:[
    {q:"P(sum=7 when rolling 2 dice)?",a:"1/6|6/36",hint:"6 ways to get 7 out of 36 outcomes"},
    {q:"P(at least one head when flipping 2 coins)?",a:"3/4",hint:"1 − P(no heads) = 1 − 1/4"},
  ],
  // C&P CH8
  c8s1:[
    {q:"P(A or B) if mutually exclusive: P(A)=0.3, P(B)=0.4?",a:"0.7",hint:"Add for mutually exclusive"},
  ],
  c8s2:[
    {q:"P(A∪B) = P(A)+P(B)−P(A∩B). If P(A)=0.5, P(B)=0.4, P(A∩B)=0.2, find P(A∪B).",a:"0.7",hint:"0.5+0.4−0.2"},
    {q:"P(A or B) if mutually exclusive: P(A)=0.25, P(B)=0.35?",a:"0.6",hint:"Add: 0.25+0.35"},
  ],
  c8s3:[
    {q:"P(not rolling a 6)?",a:"5/6",hint:"1 − 1/6"},
    {q:"P(A) = 0.7. P(not A)?",a:"0.3",hint:"1 − 0.7"},
  ],
  c8s4:[
    {q:"P(heads and then tails) flipping fair coin twice?",a:"1/4",hint:"1/2 × 1/2 for independent events"},
    {q:"P(A and B) if independent, P(A)=1/3, P(B)=1/4?",a:"1/12",hint:"Multiply: 1/3 × 1/4"},
  ],
  c8s5:[
    {q:"Draw 2 cards without replacement. P(both aces)?",a:"1/221|4/52×3/51",hint:"4/52 × 3/51"},
    {q:"Bag: 5 red, 3 blue. Draw 2 without replacement. P(first red, second blue)?",a:"15/56",hint:"5/8 × 3/7"},
  ],
  // C&P CH11
  c11s1:[
    {q:"What is the 4th row of Pascal's Triangle (row 0 is the first)?",a:"1,4,6,4,1|1 4 6 4 1",hint:"Each entry is the sum of the two above it"},
    {q:"What is C(5,2) from Pascal's Triangle?",a:"10",hint:"Row 5, entry at position 2"},
  ],
  c11s2:[
    {q:"Pascal's Identity: C(n,k) = C(n−1,k−1) + C(n−1,k). Verify with n=4,k=2.",a:"C(3,1)+C(3,2)=3+3=6=C(4,2)|6",hint:"C(4,2)=6, and C(3,1)+C(3,2)=3+3=6"},
  ],
  c11s3:[
    {q:"C(3,1)+C(4,1)+C(5,1)+C(6,1) = C(?,2)",a:"7",hint:"Hockey Stick: sum of C(r,1) from r=1 to n = C(n+1,2)"},
  ],
  c11s4:[
    {q:"Sum of all entries in row 6 of Pascal's Triangle?",a:"64",hint:"Sum of row n = 2ⁿ"},
    {q:"Sum of all entries in row 10?",a:"1024",hint:"2¹⁰"},
  ],
};

// Challenge problems (1 per section, harder)
const CHALLENGES = {
  a1s2:{q:"Evaluate: 2 + 3 × 4² ÷ 8 − 1",a:"7",hint:"Exponents → ×÷ → +−: 3×16÷8=6, then 2+6−1"},
  a1s3:{q:"Find a,b such that (a−b) − (b−a) = 10 and a+b=7.",a:"a=6,b=1|a=6 b=1",hint:"(a−b)−(b−a)=2(a−b)=10 → a−b=5, combined with a+b=7"},
  a1s5:{q:"Solve: (x+1)/2 = (x−1)/3 + 1",a:"5",hint:"Multiply everything by 6 to clear fractions"},
  a1s6:{q:"If 2ˣ = 32, what is 2^(x+3)?",a:"256",hint:"x=5, so 2⁸=256"},
  a2s3:{q:"Expand and simplify: (x+2)² − (x−2)²",a:"8x",hint:"Difference of squares approach or FOIL both"},
  a3s2:{q:"Solve: (2x+1)/3 − (x−2)/2 = 1",a:"1",hint:"Multiply by 6 to clear denominators"},
  a3s3:{q:"A train goes 60mph east and another 80mph west from the same station. After how many hours are they 350 miles apart?",a:"2.5",hint:"(60+80)t = 350"},
  a5s2:{q:"Solve: y=x²−1 and y=x+1. Find all intersection points.",a:"(2,3),(-1,0)",hint:"Set x²−1=x+1 → x²−x−2=0"},
  a5s3:{q:"Find integers x,y: 3x+2y=17 and 5x−3y=1.",a:"x=5,y=1",hint:"Multiply and eliminate"},
  a6s4:{q:"A store marks up cost by 40% to get selling price. Then gives 20% discount. Overall markup %?",a:"12",hint:"1.4 × 0.8 = 1.12, so 12% markup"},
  a7s4:{q:"Two trains 400 miles apart approach each other at 60 and 80 mph. After how long do they meet?",a:"2.857|20/7",hint:"Distance = rate × time: (60+80)t = 400"},
  a8s4:{q:"Find the equation of the perpendicular bisector of (1,3) and (5,7).",a:"y=-x+9",hint:"Midpoint (3,5), slope of segment=1, perpendicular slope=−1"},
  a9s3:{q:"Find all integers n such that n² < 3n + 10.",a:"-2,-1,0,1,2,3,4",hint:"n²−3n−10<0 → (n−5)(n+2)<0 → −2<n<5"},
  a10s2:{q:"Factor: x⁴ − 13x² + 36",a:"(x^2-4)(x^2-9)|(x+2)(x-2)(x+3)(x-3)",hint:"Let u=x², factor u²−13u+36"},
  a11s2:{q:"Compute: 999² using difference of squares.",a:"998001",hint:"(1000−1)²=1000²−2000+1"},
  a13s3:{q:"Solve x² − 6x + 10 = 0. Express as a+bi.",a:"3+i,3-i|3±i",hint:"Discriminant = 36−40=−4, √(−4)=2i"},
  a14s1:{q:"Find the vertex and axis of y=2x²−8x+5.",a:"vertex (2,-3), axis x=2",hint:"h=−b/(2a)=2, k=2(4)−16+5=−3"},
  a16s3:{q:"If f(f(x)) = x and f(2) = 5, what is f(5)?",a:"2",hint:"If f is its own inverse, f(f(x))=x means f(5)=f(f(2))=2"},
  a21s3:{q:"Sum of infinite geometric series a₁=6, r=1/3.",a:"9",hint:"S∞ = a/(1−r) = 6/(2/3) = 9"},
  c1s5:{q:"How many ways can 5 people sit in a row if two specific people must sit next to each other?",a:"48",hint:"Treat the pair as one unit: 4!×2=48"},
  c2s3:{q:"How many integers 1–100 are divisible by neither 2 nor 3?",a:"33",hint:"Use inclusion-exclusion: 100−50−33+16=33"},
  c3s3:{q:"How many diagonals does a hexagon have?",a:"9",hint:"C(6,2)−6 = 15−6 = 9"},
  c4s2:{q:"A committee of 4 from 5 men and 6 women must have at least 2 women. How many ways?",a:"280",hint:"C(6,2)C(5,2)+C(6,3)C(5,1)+C(6,4)C(5,0)=150+100+15+15=280"},
  c5s2:{q:"Count paths from (0,0) to (4,4) that stay below the diagonal (never go above y=x).",a:"14",hint:"Catalan number C₄ = C(8,4)/5 = 70/5 = 14"},
  c7s4:{q:"P(sum ≥ 10 when rolling 2 dice)?",a:"1/6|6/36",hint:"Pairs: (4,6),(5,5),(6,4),(5,6),(6,5),(6,6) = 6 outcomes"},
  c8s4:{q:"At least one head in 3 fair coin flips. Probability?",a:"7/8",hint:"1 − P(all tails) = 1 − 1/8"},
  c8s5:{q:"Bag: 4 red, 6 blue. Pick 2 without replacement. P(different colors)?",a:"8/15",hint:"P(RB)+P(BR) = 4/10×6/9 + 6/10×4/9"},
  c11s4:{q:"What is C(0,0)+C(1,0)+C(2,0)+...+C(n,0) for any n?",a:"n+1",hint:"Each C(k,0)=1, sum of n+1 ones"},
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const INIT_P=(name,color,profileType="CIPHER")=>({
  name,color,profileType,
  xp:0,flux:0,lc:30,pulse:0,lastActive:null,
  sectionsToday:0,lastSyncDate:null,
  gameTimeUsedMs:0,lastGameDate:null,
  sectionsDone:{},proofsDone:{},challengesDone:{},
  topicMastery:{},          // {sectionId: {attempts,correct,lastSeen}}
  bountyCorrectToday:0,bountyCountToday:0,lastBountyDate:null,
  learnProgress:{},         // {sectionId: {done,correct}}
  baselineComplete:false,   // one-time assessment
  baselineScore:null,
  baselineWeakTopics:[],
  biweeklyTests:[],         // [{date,score,topics,weakTopics}]
  lastTestDate:null,
  nextTestDate:null,
  pendingRedemptions:[],    // [{id,rewardId,label,flux,date,status}]
  tabSwitchCount:0,         // lifetime
  tabSwitchToday:0,
  chatHistory:[],
  streakShield:false,       // 11yr old perk
  currentStreak:0,
});
function migrateV6toV7(v6){
  // Migrate old profile fields, add new ones with defaults
  const migrate=(p,name,color)=>({
    ...INIT_P(name,color),
    xp:p.xp||0,
    flux:p.xp||0, // seed flux from old XP as starting balance
    lc:p.lc||30,
    pulse:p.pulse||0,
    lastActive:p.lastActive||null,
    sectionsToday:p.sectionsToday||0,
    lastSyncDate:p.lastSyncDate||null,
    gameTimeUsedMs:p.gameTimeUsedMs||0,
    lastGameDate:p.lastGameDate||null,
    sectionsDone:p.sectionsDone||{},
    proofsDone:p.proofsDone||{},
    challengesDone:p.challengesDone||{},
    bountyCorrectToday:p.bountyCorrectToday||0,
    bountyCountToday:p.bountyCountToday||0,
    lastBountyDate:p.lastBountyDate||null,
    chatHistory:p.chatHistory||[],
  });
  return{
    CIPHER:migrate(v6.CIPHER||{},"CIPHER","#00ffcc","CIPHER"),
    NOVA:migrate(v6.NOVA||{},"NOVA","#ff44cc","NOVA"),
    rewards:DEFAULT_REWARDS,
    rivalSession:null,
  };
}
function loadState(){
  try{
    const r7=localStorage.getItem(STORAGE_KEY);
    if(r7){const p=JSON.parse(r7);if(p.CIPHER&&p.NOVA)return p;}
    // Try migrating v6
    const r6=localStorage.getItem(STORAGE_KEY_V6);
    if(r6){const p6=JSON.parse(r6);if(p6.CIPHER||p6.NOVA)return migrateV6toV7(p6);}
  }catch{}
  return null;
}
function saveState(s){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}}
function today(){return new Date().toISOString().slice(0,10);}
function norm(s){
  return String(s).toLowerCase()
    .replace(/\s+/g,"")
    .replace(/[^a-z0-9.+\-*/^,=><(){}\[\]_]/g,"");
}
function checkAns(user,correct){
  const u=norm(user);
  if(!u) return false;
  const alts=correct.split("|").map(norm);
  
  for(const a of alts){
    if(!a) continue;
    
    // 1. Exact match after normalisation
    if(u===a) return true;
    
    // 2. Numeric equivalence: 3/4 = 0.75, -1/2 = -0.5
    const uN=parseFloat(u);
    const aN=parseFloat(a);
    if(!isNaN(uN)&&!isNaN(aN)&&Math.abs(uN-aN)<0.001) return true;
    
    // 3. Fraction equivalence: 6/36 = 1/6
    const uFrac=u.match(/^(-?[0-9]+)\/([0-9]+)$/);
    const aFrac=a.match(/^(-?[0-9]+)\/([0-9]+)$/);
    if(uFrac&&aFrac){
      const uVal=parseInt(uFrac[1])/parseInt(uFrac[2]);
      const aVal=parseInt(aFrac[1])/parseInt(aFrac[2]);
      if(Math.abs(uVal-aVal)<0.0001) return true;
    }
    
    // 4. Two-solution order independence: x=2,x=-3 = x=-3,x=2
    if(u.includes(",")&&a.includes(",")){
      const uParts=u.split(",").map(s=>s.trim()).sort();
      const aParts=a.split(",").map(s=>s.trim()).sort();
      if(uParts.length===aParts.length&&uParts.every((p,i)=>p===aParts[i])) return true;
    }
    
    // 5. Factor order independence: (x+3)(x-4) = (x-4)(x+3)
    const uFactors=u.match(/\([^)]+\)/g);
    const aFactors=a.match(/\([^)]+\)/g);
    if(uFactors&&aFactors&&uFactors.length===aFactors.length&&uFactors.length>1){
      const uSorted=[...uFactors].sort().join("");
      const aSorted=[...aFactors].sort().join("");
      if(uSorted===aSorted) return true;
    }
    
    // 6. Short keyword match (yes/no/open/closed etc - max 12 chars)
    if(a.length<=12&&u===a) return true;
    if(/^(yes|no|open|closed|true|false|prime|composite|rational|irrational|imaginary|real|infinite|increasing|decreasing|undefined)$/.test(a)&&u===a) return true;
  }
  return false;
}
function plural(n,w){return `${n} ${w}${n===1?"":"s"}`;}
function fmtTime(ms){const m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000);return `${m}:${String(s).padStart(2,"0")}`;}

// ═══════════════════════════════════════════════════════════
// BOUNTY BOARD — Dynamic question generator
// Questions scale to unlocked sections; harder the more they know
// ═══════════════════════════════════════════════════════════

// Question templates by topic — generated dynamically
function generateBountyQuestions(profile, count=8){
  const done=Object.keys(profile.sectionsDone||{});
  const allSections=CURRICULUM.flatMap(b=>b.chapters).flatMap(c=>c.sections);
  const unlockedIds=new Set(done);
  // Include all sections from chapters that have at least one done section
  const unlockedChapters=new Set(
    CURRICULUM.flatMap(b=>b.chapters)
      .filter(ch=>ch.sections.some(s=>unlockedIds.has(s.id)))
      .map(ch=>ch.id)
  );

  const pool=[];

  // ── Arithmetic / Numbers (always available) ─────────────────
  pool.push(...[
    {q:"What is 17 × 13?",a:"221",xp:BOUNTY_XP,tag:"arithmetic"},
    {q:"Simplify: 144 ÷ 12 + 5 × 3",a:"27",xp:BOUNTY_XP,tag:"arithmetic",hint:"Order of operations"},
    {q:"What is 2^10?",a:"1024",xp:BOUNTY_XP,tag:"exponents"},
    {q:"What is √144?",a:"12",xp:BOUNTY_XP,tag:"radicals"},
    {q:"What is 3^4?",a:"81",xp:BOUNTY_XP,tag:"exponents"},
    {q:"Evaluate: 5! (five factorial)",a:"120",xp:BOUNTY_XP,tag:"arithmetic"},
    {q:"What is 15% of 200?",a:"30",xp:BOUNTY_XP,tag:"percent"},
    {q:"What is 7² + 8²?",a:"113",xp:BOUNTY_XP,tag:"arithmetic"},
    {q:"A store raises price by 20%, then cuts it 20%. Net change?",a:"4% decrease|-4%",xp:BOUNTY_XP+5,tag:"percent",hint:"1.2 × 0.8 = 0.96"},
  ]);

  // ── Algebra basics (a1–a5 unlocked) ─────────────────────────
  if(done.some(id=>id.startsWith("a1")||id.startsWith("a2")||id.startsWith("a3"))){
    pool.push(...[
      {q:"Solve: 4x − 7 = 13",a:"5",xp:BOUNTY_XP,tag:"linear"},
      {q:"Solve: 3(x+2) = 21",a:"5",xp:BOUNTY_XP,tag:"linear"},
      {q:"Simplify: 5x + 3 − 2x + 7",a:"3x+10",xp:BOUNTY_XP,tag:"algebra"},
      {q:"Expand: (x+3)(x−3)",a:"x^2-9",xp:BOUNTY_XP,tag:"algebra",hint:"Difference of squares"},
      {q:"Factor: x² − 9",a:"(x+3)(x-3)",xp:BOUNTY_XP,tag:"factoring"},
      {q:"If f(x) = 3x−1, find f(4)",a:"11",xp:BOUNTY_XP,tag:"functions"},
      {q:"Solve: (x+1)/3 = 4",a:"11",xp:BOUNTY_XP,tag:"linear"},
    ]);
  }

  // ── Systems & ratios (a5–a7 unlocked) ───────────────────────
  if(done.some(id=>["a5s1","a5s2","a5s3","a6s1","a7s1"].includes(id))){
    pool.push(...[
      {q:"Solve: x+y=10 and x−y=4. Find x.",a:"7",xp:BOUNTY_XP,tag:"systems"},
      {q:"Two numbers have ratio 3:5 and sum 40. Find the smaller.",a:"15",xp:BOUNTY_XP,tag:"ratio"},
      {q:"If y varies directly with x and y=8 when x=2, find y when x=7.",a:"28",xp:BOUNTY_XP,tag:"proportion"},
      {q:"Train A travels at 60mph, Train B at 90mph. They start 300mi apart heading toward each other. When do they meet? (hours)",a:"2",xp:BOUNTY_XP+5,tag:"word problem",hint:"60t+90t=300"},
    ]);
  }

  // ── Quadratics (a10–a13 unlocked) ───────────────────────────
  if(done.some(id=>id.startsWith("a10")||id.startsWith("a11")||id.startsWith("a13"))){
    pool.push(...[
      {q:"Factor: x² − 7x + 12",a:"(x-3)(x-4)",xp:BOUNTY_XP,tag:"quadratic"},
      {q:"Factor: x² + 5x + 6",a:"(x+2)(x+3)",xp:BOUNTY_XP,tag:"quadratic"},
      {q:"Solve using quadratic formula: x²−6x+5=0",a:"x=1,x=5|x=5,x=1",xp:BOUNTY_XP+5,tag:"quadratic"},
      {q:"What is the discriminant of 2x²−3x+1=0?",a:"1",xp:BOUNTY_XP,tag:"quadratic",hint:"b²−4ac = 9−8"},
      {q:"Factor completely: 2x²+7x+3",a:"(2x+1)(x+3)",xp:BOUNTY_XP+5,tag:"quadratic"},
      {q:"Expand: (x+5)²",a:"x^2+10x+25",xp:BOUNTY_XP,tag:"quadratic"},
      {q:"Solve: x²=49",a:"x=7,x=-7|x=±7",xp:BOUNTY_XP,tag:"quadratic"},
    ]);
  }

  // ── Functions (a16) ──────────────────────────────────────────
  if(done.some(id=>id.startsWith("a16"))){
    pool.push(...[
      {q:"If f(x)=x²+1 and g(x)=2x, find f(g(3)).",a:"37",xp:BOUNTY_XP+5,tag:"functions",hint:"g(3)=6, then f(6)=37"},
      {q:"What is the inverse of f(x)=3x+6?",a:"(x-6)/3|x/3-2",xp:BOUNTY_XP+5,tag:"functions"},
      {q:"If f(x)=√(x−2), what is the domain?",a:"x>=2|x≥2",xp:BOUNTY_XP,tag:"functions"},
    ]);
  }

  // ── Sequences (a21) ──────────────────────────────────────────
  if(done.some(id=>id.startsWith("a21"))){
    pool.push(...[
      {q:"Find the sum of the first 20 positive integers.",a:"210",xp:BOUNTY_XP,tag:"sequences",hint:"n(n+1)/2 = 20×21/2"},
      {q:"Geometric sequence: 3,6,12,24,... What is the 7th term?",a:"192",xp:BOUNTY_XP,tag:"sequences",hint:"a₇=3×2⁶=192"},
      {q:"Sum of geometric series: 1+2+4+8+...+128",a:"255",xp:BOUNTY_XP,tag:"sequences",hint:"a(rⁿ−1)/(r−1)=(2⁸−1)/1"},
    ]);
  }

  // ── C&P (unlocked) ───────────────────────────────────────────
  if(done.some(id=>id.startsWith("c"))){
    pool.push(...[
      {q:"How many ways to arrange 5 different books on a shelf?",a:"120",xp:BOUNTY_XP,tag:"counting"},
      {q:"C(8,3) = ?",a:"56",xp:BOUNTY_XP,tag:"combinations"},
      {q:"How many diagonals does an octagon have?",a:"20",xp:BOUNTY_XP+5,tag:"counting",hint:"C(8,2)−8=28−8"},
      {q:"Probability of rolling two sixes in a row?",a:"1/36",xp:BOUNTY_XP,tag:"probability"},
      {q:"How many 3-digit even numbers exist?",a:"450",xp:BOUNTY_XP+5,tag:"counting",hint:"9×10×5=450"},
    ]);
  }

  // ── Hard challenge questions (unlocked after a lot of progress) ─
  if(done.length>=20){
    pool.push(...[
      {q:"HARD: If x+y=5 and xy=6, find x²+y².",a:"13",xp:BOUNTY_XP*2,tag:"challenge",hint:"(x+y)²=x²+2xy+y²"},
      {q:"HARD: How many integers 1–200 are divisible by 3 or 5?",a:"93",xp:BOUNTY_XP*2,tag:"challenge",hint:"Inclusion-exclusion: 66+40−13"},
      {q:"HARD: Solve x²−x−6=0 and x²+x−6=0. What is the common positive root?",a:"2",xp:BOUNTY_XP*2,tag:"challenge"},
      {q:"HARD: If log₂(x)=5, what is x?",a:"32",xp:BOUNTY_XP*2,tag:"challenge"},
      {q:"HARD: Arithmetic sequence has a₁=7, a₁₀=34. What is the common difference?",a:"3",xp:BOUNTY_XP*2,tag:"sequences",hint:"d=(34−7)/9"},
    ]);
  }

  // Shuffle and pick `count`
  const shuffled=[...pool].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,count);
}

// Compute how many earned game minutes a profile has today
function getEarnedGameMins(profile){
  const t=today();
  const sectionMins=(profile.lastSyncDate===t?(profile.sectionsToday||0):0)*MINS_PER_SECTION;
  const bountyMins=(profile.lastBountyDate===t?(profile.bountyCorrectToday||0):0)*MINS_PER_BOUNTY_CORRECT;
  return Math.min(MAX_GAME_MINS, sectionMins+bountyMins);
}

// ═══════════════════════════════════════════════════════════
// BOUNTY BOARD COMPONENT
// ═══════════════════════════════════════════════════════════
function BountyBoard({profile,onClose,onCorrect,onSpendLC}){
  const t=today();
  const isToday=profile.lastBountyDate===t;
  const usedToday=isToday?(profile.bountyCountToday||0):0;
  const correctToday=isToday?(profile.bountyCorrectToday||0):0;
  const earnedMins=Math.min(MAX_GAME_MINS, sectionMins+bountyMins);
  const remaining=BOUNTY_DAILY_CAP-usedToday;

  const [questions,setQuestions]=useState(()=>generateBountyQuestions(profile,8));
  const [qIdx,setQIdx]=useState(0);
  const [input,setInput]=useState("");
  const [hint,setHint]=useState(false);
  const [revealed,setRevealed]=useState(false);
  const [flash,setFlash]=useState(null);
  const [sessionCorrect,setSessionCorrect]=useState(0);
  const [sessionXP,setSessionXP]=useState(0);
  const [answered,setAnswered]=useState([]);
  const [done,setDone]=useState(false);
  const inputRef=useRef(null);
  useEffect(()=>{inputRef.current?.focus();},[qIdx]);

  if(remaining<=0||done){
    return(
      <BountyOverlay onClose={onClose}>
        <div style={{textAlign:"center",padding:"2rem"}}>
          <div style={{fontSize:"3rem",marginBottom:"0.5rem"}}>{remaining<=0?"🔒":"🏆"}</div>
          <div style={{fontFamily:"Orbitron,sans-serif",color:"#ffdd00",fontSize:"1.1rem",marginBottom:"0.94rem"}}>{remaining<=0?"BOUNTY CAP REACHED":"BOUNTY COMPLETE"}</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#8899aa",marginBottom:"0.5rem"}}>
            Today: {correctToday}/{usedToday} correct · +{correctToday*BOUNTY_XP} XP earned
          </div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#00ffcc",marginBottom:"1.5rem"}}>
            ⏱ Game time unlocked: <b>{earnedMins} min</b> today
          </div>
          {done&&sessionCorrect>0&&(
            <div style={{background:"#001a10",border:"1px solid #00ffcc33",padding:"0.94rem",marginBottom:"1rem",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#00ffcc"}}>
              Session: +{sessionXP} XP · {sessionCorrect} correct · +{sessionCorrect*MINS_PER_BOUNTY_CORRECT} min game time
            </div>
          )}
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"1.5rem"}}>
            {remaining<=0?"Come back tomorrow for more bounties. Solve more sections to unlock harder questions!":"Great work! Earn game time by answering more tomorrow."}
          </div>
          <button onClick={onClose} style={S.btnCyber}>RETURN TO OS</button>
        </div>
      </BountyOverlay>
    );
  }

  const q=questions[qIdx];
  const totalQ=questions.length;

  function submit(){
    if(revealed)return;
    const ok=checkAns(input,q.a);
    const newAnswered=[...answered,{q:q.q,ok,xp:ok?q.xp:0}];
    setAnswered(newAnswered);
    setFlash(ok?"good":"bad");
    setTimeout(()=>setFlash(null),600);
    if(ok){
      setSessionCorrect(c=>c+1);
      setSessionXP(x=>x+q.xp);
      onCorrect(q.xp,true); // XP + bounty correct count
      setInput("");setHint(false);
      if(qIdx+1>=totalQ||usedToday+qIdx+1>=BOUNTY_DAILY_CAP){
        setTimeout(()=>setDone(true),500);
      } else {
        setTimeout(()=>setQIdx(i=>i+1),500);
      }
    } else {
      setRevealed(false); // let them try again or reveal
    }
  }

  function revealAns(){
    onSpendLC(REVEAL_COST);
    onCorrect(0,false);
    setRevealed(true);
  }
  function nextQ(){
    setRevealed(false);setHint(false);setInput("");
    if(qIdx+1>=totalQ||usedToday+qIdx+1>=BOUNTY_DAILY_CAP){setDone(true);}
    else setQIdx(i=>i+1);
  }

  const color=profile.color;
  const diffColor=q.xp>BOUNTY_XP?"#ffdd00":q.xp===BOUNTY_XP?"#00ffcc":"#8899aa";

  return(
    <BountyOverlay onClose={onClose}>
      {/* Header */}
      <div style={{padding:"0.9rem 1.25rem",borderBottom:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#ffdd00,#ff8800)"}}/>
        <div>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.95rem",color:"#ffdd00",letterSpacing:"0.1em"}}>⚡ BOUNTY BOARD</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#8899aa",marginTop:"0.15rem"}}>
            Q {qIdx+1}/{Math.min(totalQ,remaining)} · {remaining-qIdx-1} remaining today · Session +{sessionXP} XP
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#00ffcc"}}>⏱ {Math.min(MAX_GAME_MINS,earnedMins+sessionCorrect*MINS_PER_BOUNTY_CORRECT)} min earned</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#aabbcc"}}>+{MINS_PER_BOUNTY_CORRECT}min per correct</div>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{display:"flex",gap:4,padding:"0.6rem 1.25rem",borderBottom:"1px solid #1a2a3a"}}>
        {questions.slice(0,Math.min(totalQ,BOUNTY_DAILY_CAP-usedToday)).map((_,i)=>{
          const ans=answered[i];
          const c=ans?(ans.ok?"#00ffcc":"#ff4444"):i===qIdx?"#ffdd00":"#1a2a3a";
          return<div key={i} style={{flex:1,height:6,background:c,transition:"all 0.3s"}}/>;
        })}
      </div>

      {/* Topic tag + difficulty */}
      <div style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 1.25rem",background:"#040b14",borderBottom:"1px solid #1a2a3a"}}>
        <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#8899aa",textTransform:"uppercase",letterSpacing:"0.1em"}}>{q.tag||"math"}</span>
        <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.96rem",color:diffColor,fontWeight:700}}>+{q.xp} XP</span>
      </div>

      {/* Question */}
      <div style={{margin:"0.85rem 1.25rem",padding:"1rem 1.1rem",background:"#040b14",border:"1px solid #ffdd0033",borderLeft:"3px solid #ffdd00",fontFamily:"Rajdhani,sans-serif",fontSize:"1.1rem",lineHeight:1.8,color:"#e0eeff",minHeight:72}}>{q.q}</div>

      {/* Hint */}
      {hint&&q.hint&&<div style={{margin:"0 1.25rem 0.5rem",padding:"0.5rem 0.9rem",background:"#1a1a00",border:"1px solid #ffdd0033",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#ffdd00"}}>💡 {q.hint}</div>}

      {/* Answer or reveal */}
      {revealed?(
        <div style={{margin:"0 1.25rem 0.75rem",padding:"0.75rem 1rem",background:"#001a10",border:"1px solid #00ffcc33"}}>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.2rem"}}>ANSWER:</div>
          <div style={{fontFamily:"Orbitron,sans-serif",color:"#00ffcc",fontSize:"1rem",marginBottom:"0.5rem"}}>{q.a.split("|")[0]}</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#ff6644",marginBottom:"0.94rem"}}>✗ No XP for revealed answers · Study it and move on</div>
          <button onClick={nextQ} style={S.btnCyber}>{qIdx+1<Math.min(totalQ,remaining)?"NEXT QUESTION →":"FINISH SESSION"}</button>
        </div>
      ):(
        <>
          <div style={{padding:"0 1.25rem 0.6rem"}}>
            {q.a&&getFormatTip(q.a)&&<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#99aabb",marginBottom:"0.3rem",padding:"0.28rem 0.5rem",background:"#060d18",border:"1px solid #1a2a3a"}}>📝 {getFormatTip(q.a)}</div>}
            <div style={{display:"flex",gap:"0.5rem"}}>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="Your answer..."
                style={{...S.ansInput,borderColor:flash==="good"?"#00ffcc":flash==="bad"?"#ff4444":"#2a3a4a",transition:"border-color 0.2s"}}/>
              <button onClick={submit} style={{...S.btnCyber,borderColor:"#ffdd00",color:"#ffdd00",whiteSpace:"nowrap"}}>CHECK</button>
            </div>
          </div>
          <div style={{display:"flex",gap:"0.94rem",padding:"0 1.25rem 1.25rem",flexWrap:"wrap"}}>
            {!hint&&q.hint&&<button onClick={()=>setHint(true)} style={S.btnGhost}>💡 HINT (no penalty)</button>}
            <button onClick={revealAns} style={{...S.btnGhost,color:"#ff6644",borderColor:"#ff664433"}}>REVEAL ANSWER</button>
            <div style={{flex:1,textAlign:"right",fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#99aabb",paddingTop:"0.4rem"}}>Correct = +{MINS_PER_BOUNTY_CORRECT}min game time</div>
          </div>
        </>
      )}
    </BountyOverlay>
  );
}
function BountyOverlay({children,onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:"1px solid #ffdd0055",width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB DETECTION — funny messages + question swap
// ═══════════════════════════════════════════════════════════
const TAB_MESSAGES = [
  {title:"NICE TRY.",        body:"Tab switch detected. New question loaded. The math gods saw everything."},
  {title:"OH REALLY?",       body:"Did you just... leave? Bold move. Here's a fresh question. Harder."},
  {title:"WE SEE YOU.",      body:"Tab switching activates the Chaos Question Protocol. Enjoy."},
  {title:"CAUGHT.",          body:"Google can't help you here. We switched the question anyway."},
  {title:"SERIOUSLY?",       body:"3 seconds on another tab. Must've been super helpful. New question!"},
  {title:"BOLD STRATEGY.",   body:"Let's see if it pays off. Spoiler: it didn't. New question incoming."},
  {title:"THE MATH IS WATCHING.", body:"It blinked. You moved. Now there's a new problem. Suspicious."},
  {title:"AH HA!",           body:"Did you think we wouldn't notice? New question. Try actually thinking."},
  {title:"TAB SWITCH #",     body:"You've done this before. The questions just get weirder. Good luck."},
];

function getTabMessage(count){
  if(count>=3) return{
    title:`TAB SWITCH #${count} — BONUS ROUND`,
    body:"You've unlocked the BONUS QUESTION. Answer it before continuing. This is your life now.",
    bonus:true
  };
  const m=TAB_MESSAGES[Math.floor(Math.random()*TAB_MESSAGES.length)];
  if(m.body.includes("#")) return{...m,body:m.body.replace("#",count)};
  return{...m,bonus:false};
}

function TabWarning({message,onDismiss}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:"#060d18",border:"2px solid #ff4444",padding:"2rem 2.5rem",maxWidth:480,textAlign:"center",boxShadow:"0 0 60px #ff444433"}}>
        <div style={{fontSize:"3rem",marginBottom:"0.75rem"}}>👀</div>
        <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.3rem",fontWeight:900,color:"#ff4444",marginBottom:"0.75rem",letterSpacing:"0.1em"}}>{message.title}</div>
        <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"1rem",color:"#c8d8e8",lineHeight:1.6,marginBottom:"1.5rem"}}>{message.body}</div>
        <button onClick={onDismiss} style={{background:"#ff4444",border:"none",color:"#fff",padding:"0.7rem 2rem",fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",fontWeight:700,cursor:"pointer",letterSpacing:"0.05em"}}>
          {message.bonus?"ANSWER BONUS QUESTION →":"OK FINE, NEW QUESTION →"}
        </button>
      </div>
    </div>
  );
}

// Hook: call inside any question-based component
function useTabDetection(enabled, onTabReturn){
  useEffect(()=>{
    if(!enabled) return;
    function onHide(){if(document.hidden) onTabReturn();}
    document.addEventListener("visibilitychange",onHide);
    return()=>document.removeEventListener("visibilitychange",onHide);
  },[enabled,onTabReturn]);
}

// ═══════════════════════════════════════════════════════════
// SCANLINES
// ═══════════════════════════════════════════════════════════
function Scanlines(){return<div style={{position:"fixed",inset:0,zIndex:9999,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)"}}/>;}

// ═══════════════════════════════════════════════════════════
// NOTIFICATION TOAST
// ═══════════════════════════════════════════════════════════
function Toast({n}){
  const C={success:"#00ffcc",warn:"#ffaa00",info:"#00aaff",error:"#ff4444"};
  const B={success:"#001a10",warn:"#1a1000",info:"#001020",error:"#1a0000"};
  return<div style={{position:"fixed",top:"1rem",right:"1rem",zIndex:9990,padding:"0.75rem 1.25rem",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",border:`1px solid ${C[n.type]}`,background:B[n.type],color:C[n.type],maxWidth:360,lineHeight:1.4}}>{n.msg}</div>;
}

// ═══════════════════════════════════════════════════════════
// PROOF MODAL — 2-3 proof Qs + optional challenge
// ═══════════════════════════════════════════════════════════
function ProofModal({section,book,existingProofs,existingChallenge,onComplete,onClose}){
  const proofs=SECTION_PROOFS[section.id]||[];
  const challenge=CHALLENGES[section.id]||null;
  const [phase,setPhase]=useState("proofs"); // "proofs" | "challenge" | "done"
  const [pIdx,setPIdx]=useState(0);
  const [pResults,setPResults]=useState(existingProofs||[]);
  const [cResult,setCResult]=useState(existingChallenge||null);
  const [input,setInput]=useState("");
  const [hint,setHint]=useState(false);
  const [revealed,setRevealed]=useState(false);
  const [flash,setFlash]=useState(null);
  const inputRef=useRef(null);

  const allProofsDone=pResults.length>=proofs.length;
  const passedProofs=pResults.filter(Boolean).length;
  const proofXp=passedProofs*PROOF_PASS_XP;
  const challengeXp=cResult===true?CHALLENGE_XP:0;

  // Phase is advanced explicitly in submitProof/nextProof - no useEffect needed
  useEffect(()=>{inputRef.current?.focus();},[pIdx,phase]);

  function advanceAfterProofs(results){
    if(CHALLENGES[section.id]){setPhase("challenge");}
    else{setPhase("done");setTimeout(()=>onComplete(results,false),250);}
  }
  function submitProof(){
    if(revealed||pResults[pIdx]!==undefined)return;
    const q=proofs[pIdx];
    if(!q)return;
    const ok=checkAns(input,q.a);
    const nr=[...pResults];nr[pIdx]=ok;setPResults(nr);
    setFlash(ok?"good":"bad");setTimeout(()=>setFlash(null),500);
    if(ok){
      setInput("");setHint(false);
      const nextIdx=pIdx+1;
      if(nextIdx<proofs.length){setTimeout(()=>setPIdx(nextIdx),450);}
      else{setTimeout(()=>advanceAfterProofs(nr),450);}
    }
  }
  function revealProof(){const nr=[...pResults];nr[pIdx]=false;setPResults(nr);setRevealed(true);}
  function nextProof(){
    setRevealed(false);setHint(false);setInput("");
    const nextIdx=pIdx+1;
    if(nextIdx<proofs.length){setPIdx(nextIdx);}
    else{advanceAfterProofs(pResults);}
  }

  function submitChallenge(){
    if(!challenge||revealed)return;
    const ok=checkAns(input,challenge.a);
    setCResult(ok);setFlash(ok?"good":"bad");setTimeout(()=>setFlash(null),500);
    if(ok){setInput("");setPhase("done");setTimeout(()=>onComplete(pResults,true),400);}
    else setRevealed(true);
  }
  function skipChallenge(){onComplete(pResults,false);}

  const accentColor=book.color;

  // DONE SCREEN
  if(phase==="done"){
    return(
      <Overlay onClose={onClose}>
        <ModalHeader title={`§${section.num} ${section.name}`} color={accentColor} onClose={onClose}/>
        <div style={{textAlign:"center",padding:"2.5rem 1.5rem"}}>
          <div style={{fontSize:"3rem",marginBottom:"0.5rem"}}>{passedProofs===proofs.length&&cResult?"🏆":passedProofs===proofs.length?"✅":"📋"}</div>
          <div style={{fontFamily:"Orbitron,sans-serif",color:accentColor,fontSize:"1.1rem",marginBottom:"0.5rem",letterSpacing:"0.05em"}}>SECTION COMPLETE</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",color:"#8899aa",marginBottom:"1.5rem",fontSize:"0.8rem"}}>
            Proofs: {passedProofs}/{proofs.length} (+{proofXp} XP){cResult?" · Challenge: ✓ (+"+CHALLENGE_XP+" XP)":cResult===false?" · Challenge: ✗":""}
          </div>
          <ScoreRow results={pResults} colors={pResults.map(r=>r?"#00ffcc":"#ff4444")}/>
          <button onClick={onClose} style={{...S.btnCyber,marginTop:"1.5rem"}}>BACK TO CHAPTER</button>
        </div>
      </Overlay>
    );
  }

  // CHALLENGE SCREEN
  if(phase==="challenge"){
    return(
      <Overlay onClose={onClose}>
        <ModalHeader title={`§${section.num} — CHALLENGE PROBLEM`} color="#ffdd00" onClose={onClose}/>
        <div style={{padding:"0.4rem 1.25rem 0.5rem",background:"#1a1500",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#ffaa00",borderBottom:"1px solid #2a2000"}}>
          ⚡ OPTIONAL · +{CHALLENGE_XP} XP if correct · Skip to save XP and continue
        </div>
        <QBox q={challenge.q} color="#ffdd00"/>
        {hint&&<HintBox hint={challenge.hint}/>}
        {revealed?(
          <RevealBox answer={challenge.a.split("|")[0]} onNext={skipChallenge} nextLabel="SKIP CHALLENGE"/>
        ):(
          <>
            <InputRow inputRef={inputRef} value={input} onChange={e=>setInput(e.target.value)} onEnter={submitChallenge} flash={flash} color="#ffdd00" onCheck={submitChallenge} correctAnswer={challenge.a}/>
            <ActionRow onHint={()=>setHint(true)} showHint={!hint} onReveal={()=>setRevealed(true)} onSkip={skipChallenge} skipLabel="SKIP CHALLENGE"/>
          </>
        )}
      </Overlay>
    );
  }

  // PROOF QUESTIONS
  const q=proofs[pIdx];
  if(!q) return null;
  return(
    <Overlay onClose={onClose}>
      <ModalHeader title={`§${section.num} ${section.name} — PROOF OF WORK`} color={accentColor} onClose={onClose}/>
      <div style={{padding:"0.4rem 1.25rem 0.5rem",background:"#030810",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1a2a3a"}}>
        <span>Q {pIdx+1}/{proofs.length}</span>
        <span style={{color:"#00ffcc"}}>{passedProofs} correct · +{proofXp} XP so far</span>
      </div>
      <ScoreRow results={pResults} total={proofs.length} color={accentColor}/>
      <QBox q={q.q} color={accentColor}/>
      {hint&&<HintBox hint={q.hint}/>}
      {revealed?(
        <>
          <RevealBox answer={q.a.split("|")[0]} onNext={pIdx<proofs.length-1?nextProof:()=>setPhase("challenge")} nextLabel={pIdx<proofs.length-1?"NEXT QUESTION":"CHALLENGE →"}/>
        </>
      ):(
        <>
          <InputRow inputRef={inputRef} value={input} onChange={e=>setInput(e.target.value)} onEnter={submitProof} flash={flash} color={accentColor} onCheck={submitProof} correctAnswer={q.a}/>
          <ActionRow onHint={()=>setHint(true)} showHint={!hint} onReveal={revealProof}/>
        </>
      )}
    </Overlay>
  );
}

// sub-components for ProofModal
function ModalHeader({title,color,onClose}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.9rem 1.25rem",borderBottom:"1px solid #1a2a3a",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:color,opacity:0.7}}/>
      <span style={{color,fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",letterSpacing:"0.05em",flexShrink:1,marginRight:"1rem"}}>{title}</span>
      <button onClick={onClose} style={S.xBtn}>✕</button>
    </div>
  );
}
function ScoreRow({results,total,color}){
  const len=total||(results?.length||3);
  return(
    <div style={{display:"flex",gap:4,padding:"0.6rem 1.25rem",borderBottom:"1px solid #1a2a3a"}}>
      {Array.from({length:len},(_,i)=>{
        const r=results?.[i];
        const c=r===true?"#00ffcc":r===false?"#ff4444":color||"#2a3a4a";
        return<div key={i} style={{flex:1,height:8,background:c,opacity:r===undefined?0.25:1,transition:"all 0.3s"}}/>;
      })}
    </div>
  );
}
function QBox({q,color}){
  return<div style={{margin:"0.75rem 1.25rem",padding:"1rem 1.1rem",background:"#040b14",border:`1px solid ${color}33`,borderLeft:`3px solid ${color}`,fontFamily:"Rajdhani,sans-serif",fontSize:"1rem",lineHeight:1.7,color:"#d0e0f0"}}>{q}</div>;
}
function HintBox({hint}){
  return<div style={{margin:"0 1.25rem 0.5rem",padding:"0.5rem 0.9rem",background:"#1a1a00",border:"1px solid #ffdd0033",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#ffdd00"}}>💡 {hint}</div>;
}
function RevealBox({answer,onNext,nextLabel}){
  return(
    <div style={{margin:"0 1.25rem 0.75rem",padding:"0.75rem 1rem",background:"#001a10",border:"1px solid #00ffcc33"}}>
      <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.25rem"}}>ANSWER:</div>
      <div style={{fontFamily:"Orbitron,sans-serif",color:"#00ffcc",fontSize:"1rem",marginBottom:"0.5rem"}}>{answer}</div>
      <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#ff6644",marginBottom:"0.94rem"}}>✗ MARKED INCORRECT — no XP for this question</div>
      <button onClick={onNext} style={S.btnCyber}>{nextLabel||"NEXT →"}</button>
    </div>
  );
}
function getFormatTip(a){
  // IMPORTANT: never reveal the actual answer value — only reveal the FORMAT TYPE
  if(!a) return null;
  const f=a.split("|")[0];
  
  // Two solutions: x=a,x=b
  if(f.match(/x=[^,]+,x=/)) 
    return "Two answers needed · Format: x=5,x=-2 (use your own values)";
  
  // Coordinate pair
  if(f.match(/^\(-?[0-9]/)) 
    return "Coordinate pair · Format: (a,b) — include the parentheses";
  
  // Fraction with variable (expression)
  if(f.includes("/")&&/[a-zA-Z(]/.test(f.replace(/[0-9]/g,"")))
    return "Expression · Format: (x-1)/2 — use / for division, () for grouping";
  
  // Plain fraction
  if(f.match(/^-?[0-9]+\/-?[0-9]+$/))
    return "Fraction · Type as: a/b — decimals also accepted";
  
  // Factored form  
  if(f.match(/\([a-z][^)]*\)\([a-z]/))
    return "Factored form · Format: (x+a)(x+b) — either order accepted";
  
  // Exponents
  if(f.includes("^"))
    return "Use ^ for exponents · Example: x^2 means x squared";
  
  // Variable expression like 3x+5 or 2x-1
  if(f.match(/^-?[0-9]*[a-z]\+/) || f.match(/^-?[0-9]*[a-z]-/))
    return "Expression · No spaces needed · Example: 3x+5";
    
  // Single variable equation like x=5  
  if(f.match(/^[a-z]=-?[0-9]/))
    return "Format: variable=value · Example: x=7";
    
  // Word answer
  if(/^(yes|no|open|closed|true|false|prime|rational|irrational|imaginary|real|infinite|increasing|decreasing|undefined|function)$/i.test(f.trim()))
    return "Word answer · Type one word";
    
  // Pure number
  if(f.match(/^-?[0-9.]+$/))
    return "Number answer · Decimals OK · Example: 42 or 3.5";
    
  return null;
}
function InputRow({inputRef,value,onChange,onEnter,flash,color,onCheck,correctAnswer}){
  const tip=correctAnswer?getFormatTip(correctAnswer):null;
  return(
    <div style={{padding:"0 1.25rem 0.6rem"}}>
      {tip&&<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#99aabb",marginBottom:"0.3rem",padding:"0.28rem 0.5rem",background:"#060d18",border:"1px solid #1a2a3a"}}>📝 {tip}</div>}
      <div style={{display:"flex",gap:"0.5rem"}}>
        <input ref={inputRef} value={value} onChange={onChange} onKeyDown={e=>e.key==="Enter"&&onCheck()}
          placeholder="Type your answer..."
          style={{...S.ansInput,borderColor:flash==="good"?"#00ffcc":flash==="bad"?"#ff4444":"#2a3a4a",transition:"border-color 0.2s"}}/>
        <button onClick={onCheck} style={{...S.btnCyber,borderColor:color,color,whiteSpace:"nowrap"}}>CHECK</button>
      </div>
    </div>
  );
}
function ActionRow({onHint,showHint,onReveal,onSkip,skipLabel}){
  return(
    <div style={{display:"flex",gap:"0.94rem",padding:"0 1.25rem 1.25rem",flexWrap:"wrap"}}>
      {showHint&&<button onClick={onHint} style={S.btnGhost}>💡 HINT</button>}
      <button onClick={onReveal} style={{...S.btnGhost,color:"#ff6644",borderColor:"#ff664433"}}>REVEAL</button>
      {onSkip&&<button onClick={onSkip} style={{...S.btnGhost,marginLeft:"auto"}}>{skipLabel||"SKIP"}</button>}
    </div>
  );
}
function Overlay({children,onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:"1px solid #2a3a4a",width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GOOGLE SNAKE (faithful recreation)
// ═══════════════════════════════════════════════════════════
function SlitherGame({onExit,gameTimeLeft,onTimeUsed}){
  const canvasRef=useRef(null);
  const stateRef=useRef(null);
  const loopRef=useRef(null);
  const startRef=useRef(null);
  const [score,setScore]=useState(0);
  const [gameOver,setGameOver]=useState(false);
  const [started,setStarted]=useState(false);
  const [paused,setPaused]=useState(false);
  const pausedRef=useRef(false);
  const [timeLeft,setTimeLeft]=useState(gameTimeLeft);
  const keysRef=useRef({});

  const W=800,H=500,CELL=12;
  const COLS=Math.floor(W/CELL),ROWS=Math.floor(H/CELL);
  const PLAYER_SPEED=120; // ms per move
  const BOT_SPEED=180;
  const FOOD_COUNT=25;
  const BOT_COUNT=5;

  const PLAYER_COLORS=["#00ffcc","#00ddff"];
  const BOT_PALETTE=[
    ["#ff4444","#ff8888"],["#ffaa00","#ffdd66"],
    ["#aa44ff","#dd88ff"],["#ff44aa","#ff88cc"],["#44aaff","#88ccff"]
  ];

  function rndPos(){return{x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}
  function rndDir(){const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];return dirs[Math.floor(Math.random()*4)];}

  function initState(){
    const foods=Array.from({length:FOOD_COUNT},()=>({...rndPos(),r:Math.random()*3+3}));
    const player={
      id:"player",body:[{x:Math.floor(COLS/2),y:Math.floor(ROWS/2)}],
      dir:{x:1,y:0},nextDir:{x:1,y:0},
      colors:PLAYER_COLORS,score:0,dead:false,
      lastMove:0,speed:PLAYER_SPEED,
    };
    for(let i=1;i<6;i++) player.body.push({x:Math.floor(COLS/2)-i,y:Math.floor(ROWS/2)});

    const bots=BOT_PALETTE.map((colors,i)=>{
      const pos={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};
      const body=[pos];
      const d=rndDir();
      for(let j=1;j<5;j++) body.push({x:((pos.x-d.x*j)+COLS*10)%COLS,y:((pos.y-d.y*j)+ROWS*10)%ROWS});
      return{id:`bot${i}`,body,dir:{...d},nextDir:{...d},colors,score:0,dead:false,lastMove:0,speed:BOT_SPEED+Math.random()*60};
    });

    return{player,bots,foods,tick:0};
  }

  function moveSnake(snake,now,allBodies){
    if(snake.dead||now-snake.lastMove<snake.speed) return;
    snake.lastMove=now;
    if(snake.id==="player"){
      // Apply queued direction (no 180)
      const nd=snake.nextDir;
      if(!(nd.x===-snake.dir.x&&nd.y===-snake.dir.y)) snake.dir={...nd};
    } else {
      // Bot AI: steer toward nearest food, avoid walls
      botSteer(snake,allBodies);
    }
    const head=snake.body[0];
    const nx=((head.x+snake.dir.x)+COLS)%COLS;
    const ny=((head.y+snake.dir.y)+ROWS)%ROWS;
    snake.body.unshift({x:nx,y:ny});
    snake.body.pop();
  }

  function botSteer(bot,allBodies){
    if(Math.random()<0.15){
      // Random turn
      const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      const valid=dirs.filter(d=>!(d.x===-bot.dir.x&&d.y===-bot.dir.y));
      bot.dir=valid[Math.floor(Math.random()*valid.length)];
      return;
    }
    // Try to avoid running into walls at edge
    const head=bot.body[0];
    if(head.x<=1&&bot.dir.x===-1) bot.dir={x:0,y:Math.random()<0.5?1:-1};
    else if(head.x>=COLS-2&&bot.dir.x===1) bot.dir={x:0,y:Math.random()<0.5?1:-1};
    else if(head.y<=1&&bot.dir.y===-1) bot.dir={x:Math.random()<0.5?1:-1,y:0};
    else if(head.y>=ROWS-2&&bot.dir.y===1) bot.dir={x:Math.random()<0.5?1:-1,y:0};
  }

  function checkEatFood(st){
    const allSnakes=[st.player,...st.bots.filter(b=>!b.dead)];
    allSnakes.forEach(snake=>{
      if(snake.dead) return;
      const head=snake.body[0];
      for(let i=st.foods.length-1;i>=0;i--){
        const f=st.foods[i];
        if(Math.abs(head.x-f.x)<=1&&Math.abs(head.y-f.y)<=1){
          st.foods.splice(i,1);
          st.foods.push({...rndPos(),r:Math.random()*3+3});
          // Grow snake by 4
          const tail=snake.body[snake.body.length-1];
          for(let j=0;j<4;j++) snake.body.push({...tail});
          snake.score++;
          if(snake.id==="player") st.playerScore=(st.playerScore||0)+10;
        }
      }
    });
  }

  function checkCollisions(st){
    const allSnakes=[st.player,...st.bots];
    allSnakes.forEach(snake=>{
      if(snake.dead) return;
      const head=snake.body[0];
      // Check head against all OTHER snakes' bodies
      allSnakes.forEach(other=>{
        if(other.dead) return;
        const bodyToCheck=other.id===snake.id?other.body.slice(4):other.body;
        for(const seg of bodyToCheck){
          if(seg.x===head.x&&seg.y===head.y){
            // Longer snake wins
            if(snake.body.length<other.body.length||snake.id!=="player"){
              snake.dead=true;
              // Drop food pellets where it died
              if(snake.id==="player") return;
              for(let i=0;i<Math.min(snake.body.length/2,8);i++){
                const pos=snake.body[Math.floor(Math.random()*snake.body.length)];
                st.foods.push({...pos,r:4+Math.random()*3});
              }
            }
          }
        }
      });
    });
  }

  function draw(st,canvas){
    const ctx=canvas.getContext("2d");
    // Dark background with grid
    ctx.fillStyle="#0a0f1a";
    ctx.fillRect(0,0,W,H);
    // Subtle grid
    ctx.strokeStyle="#111827";ctx.lineWidth=0.5;
    for(let x=0;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H);ctx.stroke();}
    for(let y=0;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W,y*CELL);ctx.stroke();}

    // Food (glowing dots)
    st.foods.forEach(f=>{
      const px=f.x*CELL+CELL/2,py=f.y*CELL+CELL/2;
      const g=ctx.createRadialGradient(px,py,0,px,py,f.r*2);
      g.addColorStop(0,"rgba(255,220,50,0.9)");
      g.addColorStop(1,"rgba(255,180,0,0)");
      ctx.fillStyle=g;
      ctx.beginPath();ctx.arc(px,py,f.r*2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#ffd700";
      ctx.beginPath();ctx.arc(px,py,f.r,0,Math.PI*2);ctx.fill();
    });

    // Draw all snakes
    const allSnakes=[...(st.bots||[]).filter(b=>!b.dead),st.player];
    allSnakes.forEach(snake=>{
      if(!snake||!snake.body) return;
      const isPlayer=snake.id==="player";
      const [c1,c2]=snake.colors;
      const len=snake.body.length;
      snake.body.forEach((seg,i)=>{
        if(i>=len) return;
        const t=i/len;
        const px=seg.x*CELL+CELL/2, py=seg.y*CELL+CELL/2;
        const r=isPlayer?(i===0?7:5-t*2):( i===0?6:4-t*1.5);
        // Body glow for player
        if(isPlayer&&i===0){
          const glow=ctx.createRadialGradient(px,py,0,px,py,r*3);
          glow.addColorStop(0,c1+"66");glow.addColorStop(1,"transparent");
          ctx.fillStyle=glow;ctx.beginPath();ctx.arc(px,py,r*3,0,Math.PI*2);ctx.fill();
        }
        // Segment color fades toward tail
        const alpha=isPlayer?1:0.85-t*0.3;
        ctx.fillStyle=i===0?c1:c2;
        ctx.globalAlpha=Math.max(0.3,alpha);
        ctx.beginPath();ctx.arc(px,py,Math.max(2,r),0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
      });
      // Eyes on head
      if(!snake.dead&&snake.body.length>0){
        const h=snake.body[0];
        const px=h.x*CELL+CELL/2, py=h.y*CELL+CELL/2;
        const d=snake.dir;
        const eyeR=isPlayer?2.5:2;
        const ex1={x:px+d.y*3,y:py-d.x*3};
        const ex2={x:px-d.y*3,y:py+d.x*3};
        [ex1,ex2].forEach(e=>{
          ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(e.x,e.y,eyeR,0,Math.PI*2);ctx.fill();
          ctx.fillStyle="#000";ctx.beginPath();ctx.arc(e.x+d.x,e.y+d.y,eyeR*0.6,0,Math.PI*2);ctx.fill();
        });
      }
    });

    // Scoreboard overlay
    ctx.fillStyle="rgba(0,0,0,0.5)";
    ctx.fillRect(W-130,4,126,14+([st.player,...(st.bots||[])].length)*14);
    ctx.fillStyle="#00ffcc";ctx.font="bold 10px monospace";
    ctx.fillText("LEADERBOARD",W-126,14);
    const sorted=[{name:"YOU",score:st.playerScore||0,color:"#00ffcc"},
      ...(st.bots||[]).map((b,i)=>({name:`BOT${i+1}`,score:b.score||0,color:b.colors[0]}))
    ].sort((a,b)=>b.score-a.score);
    sorted.forEach((e,i)=>{
      ctx.fillStyle=e.color;
      ctx.font=`${e.name==="YOU"?"bold ":""}9px monospace`;
      ctx.fillText(`${i+1}. ${e.name}: ${e.score}`,W-126,26+i*14);
    });
  }

  const gameLoop=useCallback(()=>{
    const st=stateRef.current;
    if(!st||pausedRef.current)return;
    const now=Date.now();
    const elapsed=startRef.current?now-startRef.current:0;
    const remaining=gameTimeLeft-elapsed;
    setTimeLeft(Math.max(0,remaining));
    if(remaining<=0){clearTimeout(loopRef.current);onTimeUsed(elapsed);setGameOver(true);return;}

    // Apply keyboard to player nextDir
    const p=st.player;
    if(!p.dead){
      if(keysRef.current["ArrowUp"]||keysRef.current["w"])    p.nextDir={x:0,y:-1};
      if(keysRef.current["ArrowDown"]||keysRef.current["s"])  p.nextDir={x:0,y:1};
      if(keysRef.current["ArrowLeft"]||keysRef.current["a"])  p.nextDir={x:-1,y:0};
      if(keysRef.current["ArrowRight"]||keysRef.current["d"]) p.nextDir={x:1,y:0};
    }

    const allBodies=[st.player,...st.bots].filter(s=>!s.dead).map(s=>s.body);
    [st.player,...st.bots].forEach(s=>moveSnake(s,now,allBodies));
    checkEatFood(st);
    checkCollisions(st);

    // Respawn dead bots
    st.bots.forEach((bot,i)=>{
      if(bot.dead&&Math.random()<0.005){
        const pos=rndPos();
        const d=rndDir();
        bot.body=[pos];
        for(let j=1;j<5;j++) bot.body.push({x:((pos.x-d.x*j)+COLS*10)%COLS,y:((pos.y-d.y*j)+ROWS*10)%ROWS});
        bot.dir={...d};bot.nextDir={...d};bot.dead=false;bot.score=0;
      }
    });

    const c=canvasRef.current;
    if(c)draw(st,c);
    setScore(st.playerScore||0);

    if(st.player.dead){
      onTimeUsed(Math.min(elapsed,gameTimeLeft));
      setGameOver(true);return;
    }
    loopRef.current=setTimeout(gameLoop,50); // 20fps
  },[gameTimeLeft,onTimeUsed]);

  function startGame(){
    clearTimeout(loopRef.current);
    stateRef.current=initState();
    setScore(0);setGameOver(false);setStarted(true);setPaused(false);pausedRef.current=false;
    startRef.current=Date.now();
    loopRef.current=setTimeout(gameLoop,100);
  }

  function togglePause(){
    const np=!pausedRef.current;pausedRef.current=np;setPaused(np);
    if(!np) loopRef.current=setTimeout(gameLoop,50);
  }

  useEffect(()=>{
    function onKeyDown(e){
      keysRef.current[e.key]=true;
      if(e.key==="p"||e.key==="P"||e.key==="Escape") togglePause();
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    }
    function onKeyUp(e){keysRef.current[e.key]=false;}
    window.addEventListener("keydown",onKeyDown);
    window.addEventListener("keyup",onKeyUp);
    return()=>{window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);clearTimeout(loopRef.current);};
  },[]);

  const mins=Math.floor(timeLeft/60000),secs=Math.floor((timeLeft%60000)/1000);
  const timePct=gameTimeLeft>0?timeLeft/gameTimeLeft:0;
  const timeColor=timePct>0.5?"#00ffcc":timePct>0.25?"#ffaa00":"#ff4444";

  return(
    <div style={{minHeight:"100vh",background:"#060d18",display:"flex",flexDirection:"column",userSelect:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.6rem 1.5rem",background:"#030810",borderBottom:"1px solid #00ffcc22",flexWrap:"wrap",gap:"0.5rem"}}>
        <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.1rem",fontWeight:700,color:"#00ffcc",letterSpacing:"0.1em"}}>◈ SLITHER</div>
        <div style={{display:"flex",gap:"1.5rem",alignItems:"center",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem"}}>
          <span style={{color:"#c8d8e8"}}>SCORE: <b style={{color:"#00ffcc"}}>{score}</b></span>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <div style={{width:100,height:6,background:"#1a2a3a",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",background:timeColor,width:`${timePct*100}%`,transition:"width 1s linear",borderRadius:3}}/>
            </div>
            <span style={{color:timeColor,fontSize:"0.94rem"}}>{mins}:{String(secs).padStart(2,"0")}</span>
          </div>
          {started&&!gameOver&&<button onClick={togglePause} style={{background:"none",border:"1px solid #2a3a4a",color:"#8899aa",padding:"0.2rem 0.6rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",borderRadius:3}}>{paused?"▶":"⏸"}</button>}
        </div>
        <button onClick={()=>{clearTimeout(loopRef.current);if(startRef.current)onTimeUsed(Math.min(Date.now()-startRef.current,gameTimeLeft));onExit();}}
          style={{background:"none",border:"1px solid #ff4444",color:"#ff4444",padding:"0.25rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",borderRadius:3}}>EXIT</button>
      </div>
      <div style={{padding:"0.25rem 1.5rem",background:"#030810",borderBottom:"1px solid #0a1a2a",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa"}}>
        Arrow keys / WASD · Eat food to grow · Avoid other snakes · You are CYAN
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",position:"relative",background:"#060d18"}}>
        {!started&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,background:"rgba(3,8,16,0.85)"}}>
            <div style={{background:"#060d18",border:"1px solid #00ffcc44",padding:"2.5rem 3.5rem",borderRadius:12,textAlign:"center",maxWidth:400}}>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"2.5rem",fontWeight:900,color:"#00ffcc",marginBottom:"0.5rem",letterSpacing:"0.15em"}}>SLITHER</div>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.5rem"}}>Grow by eating food · Avoid bots · You are the CYAN snake</div>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:timeColor,marginBottom:"1.5rem"}}>⏱ {mins}:{String(secs).padStart(2,"0")} game time left today</div>
              <button onClick={startGame} style={{background:"#00ffcc",border:"none",color:"#000",padding:"0.8rem 2.5rem",borderRadius:8,fontFamily:"Orbitron,sans-serif",fontWeight:700,fontSize:"1rem",cursor:"pointer",letterSpacing:"0.05em"}}>PLAY</button>
            </div>
          </div>
        )}
        {paused&&started&&!gameOver&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,background:"rgba(3,8,16,0.7)"}}>
            <div style={{background:"#060d18",border:"1px solid #2a3a4a",padding:"2rem 3rem",borderRadius:12,textAlign:"center"}}>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.5rem",color:"#8899aa",marginBottom:"1rem"}}>⏸ PAUSED</div>
              <button onClick={togglePause} style={{...S.btnCyber}}>RESUME</button>
            </div>
          </div>
        )}
        {gameOver&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,background:"rgba(3,8,16,0.85)"}}>
            <div style={{background:"#060d18",border:"1px solid #00ffcc44",padding:"2.5rem 3.5rem",borderRadius:12,textAlign:"center"}}>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.8rem",fontWeight:700,color:timeLeft<=0?"#ff4444":"#ff6644",marginBottom:"0.5rem"}}>{timeLeft<=0?"TIME'S UP":"ELIMINATED"}</div>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"2.5rem",fontWeight:900,color:"#00ffcc",marginBottom:"1.5rem"}}>{score}</div>
              <div style={{display:"flex",gap:"1rem",justifyContent:"center"}}>
                {timeLeft>0&&<button onClick={startGame} style={{background:"#00ffcc",border:"none",color:"#000",padding:"0.7rem 1.8rem",borderRadius:8,fontFamily:"Orbitron,sans-serif",fontWeight:700,cursor:"pointer"}}>PLAY AGAIN</button>}
                <button onClick={()=>{clearTimeout(loopRef.current);onExit();}} style={S.btnGhost}>EXIT</button>
              </div>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} width={W} height={H}
          style={{display:"block",border:"1px solid #1a2a3a",borderRadius:8,maxWidth:"100%",boxShadow:"0 0 40px rgba(0,255,204,0.05)",outline:"none"}}
          tabIndex={0}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BASELINE ASSESSMENT — one-time adaptive test per kid
// ═══════════════════════════════════════════════════════════
const BASELINE_QUESTIONS = {
  // CIPHER (11yr old): Algebra A/B + intro C&P
  CIPHER: [
    // Algebra foundations
    {id:"b1",q:"Solve: 3x + 7 = 22",a:"5",topic:"linear",difficulty:1},
    {id:"b2",q:"Expand: (x+4)(x-3)",a:"x^2+x-12",topic:"quadratic",difficulty:2},
    {id:"b3",q:"Factor: x² - 5x + 6",a:"(x-2)(x-3)",topic:"factoring",difficulty:2},
    {id:"b4",q:"Solve: 2x² - 8 = 0",a:"x=2,x=-2|x=±2",topic:"quadratic",difficulty:2},
    {id:"b5",q:"If f(x) = 2x + 1, find f(f(3)).",a:"15",topic:"functions",difficulty:3},
    {id:"b6",q:"Solve the system: x + y = 10, x - y = 4",a:"x=7,y=3|x=7 y=3",topic:"systems",difficulty:2},
    {id:"b7",q:"Simplify: (x²·x³)/x⁴",a:"x",topic:"exponents",difficulty:2},
    {id:"b8",q:"A bag has 4 red and 6 blue marbles. P(red)?",a:"2/5|4/10",topic:"probability",difficulty:1},
    {id:"b9",q:"How many ways to arrange 5 different books?",a:"120",topic:"counting",difficulty:2},
    {id:"b10",q:"What is the sum of the first 10 positive integers?",a:"55",topic:"sequences",difficulty:2},
    {id:"b11",q:"Factor: x² - 9",a:"(x+3)(x-3)",topic:"factoring",difficulty:1},
    {id:"b12",q:"Solve: |x - 3| = 5",a:"x=8,x=-2|x=-2,x=8",topic:"absolute_value",difficulty:2},
    {id:"b13",q:"C(6,2) = ?",a:"15",topic:"combinations",difficulty:2},
    {id:"b14",q:"What is the slope of y = 3x - 7?",a:"3",topic:"graphing",difficulty:1},
    {id:"b15",q:"HARD: If x + y = 5 and xy = 6, find x² + y².",a:"13",topic:"algebra_hard",difficulty:3},
    {id:"b16",q:"How many 3-digit even numbers exist?",a:"450",topic:"counting",difficulty:3},
    {id:"b17",q:"Find the quadratic with roots x=3 and x=-2.",a:"x^2-x-6|(x-3)(x+2)",topic:"quadratic",difficulty:3},
    {id:"b18",q:"Geometric sequence: 2, 6, 18... What is the 5th term?",a:"162",topic:"sequences",difficulty:2},
    {id:"b19",q:"P(rolling sum=8 with two dice)?",a:"5/36",topic:"probability",difficulty:3},
    {id:"b20",q:"Solve: x² + 4x + 4 = 0",a:"x=-2",topic:"quadratic",difficulty:2},
  ],
  // NOVA (13yr old): C&P mastery check + Number Theory intro
  NOVA: [
    {id:"n1",q:"C(8,3) = ?",a:"56",topic:"combinations",difficulty:1},
    {id:"n2",q:"How many ways to arrange letters in MATH?",a:"24",topic:"permutations",difficulty:1},
    {id:"n3",q:"P(drawing two aces in a row from a standard deck, no replacement)?",a:"1/221|4/52*3/51",topic:"probability",difficulty:2},
    {id:"n4",q:"Paths from (0,0) to (4,3) using only right/up steps?",a:"35",topic:"combinations",difficulty:2},
    {id:"n5",q:"Is 91 prime?",a:"no",topic:"number_theory",difficulty:1,hint:"91 = 7 × 13"},
    {id:"n6",q:"What is 17 mod 5?",a:"2",topic:"modular",difficulty:1},
    {id:"n7",q:"Sum of row 6 of Pascal's Triangle?",a:"64",topic:"pascal",difficulty:2},
    {id:"n8",q:"How many divisors does 36 have?",a:"9",topic:"number_theory",difficulty:2},
    {id:"n9",q:"P(at least one head in 4 fair coin flips)?",a:"15/16",topic:"probability",difficulty:2},
    {id:"n10",q:"In how many ways can 3 people be chosen from 8 for president, VP, secretary (order matters)?",a:"336",topic:"permutations",difficulty:2},
    {id:"n11",q:"What is gcd(48, 36)?",a:"12",topic:"number_theory",difficulty:2},
    {id:"n12",q:"How many integers 1-100 are divisible by 3 or 5?",a:"47",topic:"counting",difficulty:2},
    {id:"n13",q:"Expected value: roll fair die, win $x where x = die value. E = ?",a:"3.5|7/2",topic:"expected_value",difficulty:2},
    {id:"n14",q:"Find all prime factors of 360.",a:"2,3,5",topic:"number_theory",difficulty:2},
    {id:"n15",q:"HARD: How many positive integers less than 100 are coprime to 100?",a:"40",topic:"number_theory",difficulty:3},
    {id:"n16",q:"P(same number on both dice when rolling two dice)?",a:"1/6|6/36",topic:"probability",difficulty:1},
    {id:"n17",q:"What is 2^10 mod 7?",a:"2",topic:"modular",difficulty:3},
    {id:"n18",q:"Binomial: (x+1)^4 expanded — what is the coefficient of x²?",a:"6",topic:"binomial",difficulty:3},
    {id:"n19",q:"How many ways to put 5 distinct balls into 3 labeled boxes?",a:"243",topic:"counting",difficulty:3},
    {id:"n20",q:"What is LCM(12, 18, 24)?",a:"72",topic:"number_theory",difficulty:2},
  ],
};

const TOPIC_LABELS={
  linear:"Linear Equations",factoring:"Factoring",quadratic:"Quadratics",
  functions:"Functions",systems:"Systems",exponents:"Exponents",
  probability:"Probability",counting:"Counting",combinations:"Combinations",
  permutations:"Permutations",sequences:"Sequences",absolute_value:"Abs. Value",
  graphing:"Graphing",algebra_hard:"Advanced Algebra",pascal:"Pascal's Triangle",
  number_theory:"Number Theory",modular:"Modular Arithmetic",
  expected_value:"Expected Value",binomial:"Binomial Theorem",
};

function BaselineAssessment({profile,onComplete}){
  const questions=BASELINE_QUESTIONS[profile.name]||BASELINE_QUESTIONS.CIPHER;
  const [qIdx,setQIdx]=useState(0);
  const [input,setInput]=useState("");
  const [results,setResults]=useState([]);
  const [flash,setFlash]=useState(null);
  const [timeLeft,setTimeLeft]=useState(180); // 3 min per q
  const [showWarning,setShowWarning]=useState(false);
  const [tabCount,setTabCount]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const inputRef=useRef(null);
  const timerRef=useRef(null);

  const q=questions[qIdx];
  const color=profile.color;

  useTabDetection(true,()=>{
    const newCount=tabCount+1;
    setTabCount(newCount);
    setShowWarning(true);
    // Swap question
    setInput("");setFlash(null);setRevealed(false);
    setTimeLeft(180);
  });

  useEffect(()=>{
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current);handleTimeout();return 0;}
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[qIdx]);

  useEffect(()=>{inputRef.current?.focus();},[qIdx]);

  function handleTimeout(){
    const nr=[...results,{q:q.q,topic:q.topic,difficulty:q.difficulty,correct:false,answered:false}];
    setResults(nr);
    if(qIdx+1<questions.length) setTimeout(()=>{setQIdx(i=>i+1);setInput("");setRevealed(false);setTimeLeft(180);},500);
    else finish(nr);
  }

  function submit(){
    if(revealed) return;
    const ok=checkAns(input,q.a);
    const nr=[...results,{q:q.q,topic:q.topic,difficulty:q.difficulty,correct:ok,answered:true}];
    setResults(nr);
    setFlash(ok?"good":"bad");
    setTimeout(()=>{
      setFlash(null);
      if(qIdx+1<questions.length){setQIdx(i=>i+1);setInput("");setRevealed(false);setTimeLeft(180);}
      else finish(nr);
    },ok?500:1200);
  }

  function reveal(){
    setRevealed(true);
    const nr=[...results,{q:q.q,topic:q.topic,difficulty:q.difficulty,correct:false,answered:false,revealed:true}];
    setResults(nr);
    clearInterval(timerRef.current);
    setTimeout(()=>{
      if(qIdx+1<questions.length){setQIdx(i=>i+1);setInput("");setRevealed(false);setTimeLeft(180);}
      else finish(nr);
    },2000);
  }

  function finish(finalResults){
    clearInterval(timerRef.current);
    const correct=finalResults.filter(r=>r.correct).length;
    const score=Math.round((correct/questions.length)*100);
    // Find weak topics (< 50% correct per topic)
    const byTopic={};
    finalResults.forEach(r=>{
      if(!byTopic[r.topic]) byTopic[r.topic]={correct:0,total:0};
      byTopic[r.topic].total++;
      if(r.correct) byTopic[r.topic].correct++;
    });
    const weak=Object.entries(byTopic).filter(([,v])=>v.correct/v.total<0.6).map(([k])=>k);
    onComplete(score,weak);
  }

  const pct=(qIdx/questions.length)*100;
  const timeColor=timeLeft>60?"#00ffcc":timeLeft>30?"#ffaa00":"#ff4444";

  return(
    <div style={{minHeight:"100vh",background:"#03080f",display:"flex",flexDirection:"column",fontFamily:"Rajdhani,sans-serif"}}>
      {showWarning&&<TabWarning message={getTabMessage(tabCount)} onDismiss={()=>setShowWarning(false)}/>}
      <Scanlines/>
      {/* Header */}
      <div style={{padding:"1rem 1.5rem",background:"#060d18",borderBottom:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1rem",fontWeight:700,color:color,letterSpacing:"0.1em"}}>BASELINE ASSESSMENT</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#99aabb",marginTop:"0.15rem"}}>This calibrates your personal curriculum · One time only</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.5rem",fontWeight:900,color:timeColor}}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa"}}>Q {qIdx+1} / {questions.length}</div>
        </div>
      </div>
      {/* Progress */}
      <div style={{height:5,background:"#0a1520"}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${color},${color}88)`,width:`${pct}%`,transition:"width 0.4s"}}/>
      </div>
      {/* Difficulty badge */}
      <div style={{padding:"0.5rem 1.5rem",background:"#040b14",borderBottom:"1px solid #1a2a3a",display:"flex",gap:"1rem",alignItems:"center"}}>
        <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#8899aa",textTransform:"uppercase"}}>{TOPIC_LABELS[q?.topic]||q?.topic}</span>
        <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:q?.difficulty===3?"#ff4444":q?.difficulty===2?"#ffaa00":"#00ffcc"}}>
          {"◆".repeat(q?.difficulty||1)}{"◇".repeat(3-(q?.difficulty||1))} DIFFICULTY
        </span>
        <div style={{flex:1,height:4,background:"#1a2a3a",borderRadius:2}}>
          <div style={{height:"100%",background:timeColor,width:`${(timeLeft/180)*100}%`,transition:"width 0.9s linear",borderRadius:2}}/>
        </div>
      </div>
      {/* Question */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"2rem 1.5rem",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{background:"#060d18",border:`1px solid ${color}33`,borderLeft:`4px solid ${color}`,padding:"1.25rem",marginBottom:"1.25rem",fontFamily:"Rajdhani,sans-serif",fontSize:"1.15rem",lineHeight:1.7,color:"#d0e8f0"}}>
          {q?.q}
        </div>
        {revealed?(
          <div style={{background:"#001a10",border:"1px solid #00ffcc33",padding:"1rem",marginBottom:"1rem"}}>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.25rem"}}>ANSWER:</div>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.1rem",color:"#00ffcc"}}>{q?.a.split("|")[0]}</div>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#ff6644",marginTop:"0.5rem"}}>Moving to next question...</div>
          </div>
        ):(
          <>
            {q?.a&&getFormatTip(q.a)&&<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#99aabb",marginBottom:"0.5rem",padding:"0.3rem 0.6rem",background:"#060d18",border:"1px solid #1a2a3a"}}>📝 {getFormatTip(q.a)}</div>}
            <div style={{display:"flex",gap:"0.75rem",marginBottom:"0.75rem"}}>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="Your answer..."
                style={{...S.ansInput,fontSize:"1.1rem",borderColor:flash==="good"?"#00ffcc":flash==="bad"?"#ff4444":color+"55"}}/>
              <button onClick={submit} style={{...S.btnCyber,borderColor:color,color,padding:"0.55rem 1.25rem",whiteSpace:"nowrap"}}>CHECK</button>
            </div>
            <button onClick={reveal} style={{...S.btnGhost,fontSize:"0.8rem",color:"#ff6644",borderColor:"#ff664433"}}>SKIP / REVEAL (no penalty, helps calibrate)</button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BIWEEKLY TEST — auto-generated from recent curriculum
// ═══════════════════════════════════════════════════════════
function BiweeklyTest({profile,onComplete}){
  // Generate questions from: 60% recent sections, 20% foundations, 20% stretch
  const [questions]=useState(()=>generateTestQuestions(profile));
  const [qIdx,setQIdx]=useState(0);
  const [input,setInput]=useState("");
  const [results,setResults]=useState([]);
  const [flash,setFlash]=useState(null);
  const [timeLeft,setTimeLeft]=useState(120);
  const [showWarning,setShowWarning]=useState(false);
  const [tabCount,setTabCount]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const inputRef=useRef(null);
  const timerRef=useRef(null);

  useTabDetection(true,()=>{setTabCount(c=>c+1);setShowWarning(true);setInput("");setFlash(null);setTimeLeft(120);});
  useEffect(()=>{
    timerRef.current=setInterval(()=>setTimeLeft(t=>{
      if(t<=1){clearInterval(timerRef.current);advance(false);return 0;}return t-1;
    }),1000);
    return()=>clearInterval(timerRef.current);
  },[qIdx]);
  useEffect(()=>{inputRef.current?.focus();},[qIdx]);

  function advance(correct){
    clearInterval(timerRef.current);
    const q=questions[qIdx];
    const nr=[...results,{...q,correct}];
    setResults(nr);
    if(qIdx+1<questions.length){
      setTimeout(()=>{setQIdx(i=>i+1);setInput("");setFlash(null);setRevealed(false);setTimeLeft(120);},correct?400:1000);
    } else {
      const score=Math.round((nr.filter(r=>r.correct).length/questions.length)*100);
      const byTopic={};
      nr.forEach(r=>{if(!byTopic[r.topic]){byTopic[r.topic]={c:0,t:0};}byTopic[r.topic].t++;if(r.correct)byTopic[r.topic].c++;});
      const weak=Object.entries(byTopic).filter(([,v])=>v.c/v.t<0.5).map(([k])=>k);
      setTimeout(()=>onComplete(score,weak),600);
    }
  }

  function submit(){
    const q=questions[qIdx];
    if(!q||revealed)return;
    const ok=checkAns(input,q.a);
    setFlash(ok?"good":"bad");
    setTimeout(()=>advance(ok),ok?400:900);
  }

  if(!questions.length) return<div style={{minHeight:"100vh",background:"#03080f",display:"flex",alignItems:"center",justifyContent:"center",color:"#00ffcc",fontFamily:"Orbitron,sans-serif"}}>No questions available yet — complete some sections first!</div>;

  const q=questions[qIdx];
  const color=profile.color;
  const timeColor=timeLeft>60?"#00ffcc":timeLeft>30?"#ffaa00":"#ff4444";

  return(
    <div style={{minHeight:"100vh",background:"#03080f",display:"flex",flexDirection:"column",fontFamily:"Rajdhani,sans-serif"}}>
      {showWarning&&<TabWarning message={getTabMessage(tabCount)} onDismiss={()=>setShowWarning(false)}/>}
      <Scanlines/>
      <div style={{padding:"1rem 1.5rem",background:"#060d18",borderBottom:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1rem",fontWeight:700,color:color}}>BI-WEEKLY TEST</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#99aabb"}}>Auto-generated from your recent curriculum</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.5rem",fontWeight:900,color:timeColor}}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa"}}>Q {qIdx+1} / {questions.length}</div>
        </div>
      </div>
      <div style={{height:5,background:"#0a1520"}}><div style={{height:"100%",background:color,width:`${(qIdx/questions.length)*100}%`,transition:"width 0.4s"}}/></div>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"2rem 1.5rem",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#99aabb",marginBottom:"0.75rem",display:"flex",justifyContent:"space-between"}}>
          <span>{TOPIC_LABELS[q?.topic]||q?.topic}</span>
          <div style={{width:160,height:5,background:"#1a2a3a",borderRadius:2,alignSelf:"center"}}>
            <div style={{height:"100%",background:timeColor,width:`${(timeLeft/120)*100}%`,transition:"width 0.9s linear",borderRadius:2}}/>
          </div>
        </div>
        <div style={{background:"#060d18",border:`1px solid ${color}33`,borderLeft:`4px solid ${color}`,padding:"1.25rem",marginBottom:"1rem",fontSize:"1.1rem",lineHeight:1.7,color:"#d0e8f0"}}>{q?.q}</div>
        {q?.a&&getFormatTip(q.a)&&<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#99aabb",marginBottom:"0.5rem",padding:"0.3rem 0.6rem",background:"#060d18",border:"1px solid #1a2a3a"}}>📝 {getFormatTip(q.a)}</div>}
        <div style={{display:"flex",gap:"0.75rem"}}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Your answer..."
            style={{...S.ansInput,borderColor:flash==="good"?"#00ffcc":flash==="bad"?"#ff4444":color+"55"}}/>
          <button onClick={submit} style={{...S.btnCyber,borderColor:color,color,whiteSpace:"nowrap"}}>CHECK</button>
        </div>
      </div>
    </div>
  );
}

function generateTestQuestions(profile){
  const done=Object.keys(profile.sectionsDone||{});
  if(done.length<3) return [];
  const allProofs=[];
  done.forEach(sid=>{
    const qs=SECTION_PROOFS[sid]||[];
    qs.forEach(q=>allProofs.push({...q,topic:sid.replace(/[0-9]/g,"").replace("s",""),sectionId:sid}));
  });
  if(allProofs.length<5) return allProofs.slice(0,5);
  const shuffled=[...allProofs].sort(()=>Math.random()-0.5);
  // 60% recent (last 5 sections done), 20% older, 20% hard
  const recent=done.slice(-5);
  const recentQs=shuffled.filter(q=>recent.includes(q.sectionId)).slice(0,9);
  const olderQs=shuffled.filter(q=>!recent.includes(q.sectionId)).slice(0,3);
  const hardQs=shuffled.filter(q=>q.hint&&q.a.includes("|")||q.a.length>5).slice(0,3);
  const combined=[...recentQs,...olderQs,...hardQs].slice(0,15);
  return combined.sort(()=>Math.random()-0.5);
}

// ═══════════════════════════════════════════════════════════
// ANSWER FORMAT GUIDE — shown once on first math session
// ═══════════════════════════════════════════════════════════
const FORMAT_EXAMPLES = [
  {type:"Number",      format:"42",           desc:"Just type the number. Decimals OK: 3.5"},
  {type:"Fraction",    format:"3/4",          desc:"Use / for fractions. 3/4 and 0.75 both work."},
  {type:"Expression",  format:"3x+5",         desc:"No spaces needed. 3x+5 or 3x + 5 both work."},
  {type:"Exponent",    format:"x^2",          desc:"Use ^ for powers. x^2 means x squared."},
  {type:"Factored",    format:"(x+3)(x-4)",   desc:"Either order works: (x-4)(x+3) also accepted."},
  {type:"Two answers", format:"x=2,x=-3",     desc:"Separate with a comma. Either order works."},
  {type:"Fraction eq", format:"(x-1)/2",      desc:"Use () to group the top: (x-1)/2"},
  {type:"Word",        format:"yes / no",     desc:"Just type the word. Spelling counts!"},
];

function AnswerGuide({onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:"1px solid #00ffcc55",width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid #1a2a3a",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#00ffcc,#ffdd00)"}}/>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1rem",color:"#00ffcc",letterSpacing:"0.1em",marginBottom:"0.2rem"}}>HOW TO TYPE ANSWERS</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.9rem",color:"#8899aa"}}>Read once — you'll see format hints on every question too</div>
        </div>
        <div style={{padding:"1rem 1.25rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
          {FORMAT_EXAMPLES.map(ex=>(
            <div key={ex.type} style={{background:"#040b14",border:"1px solid #1a2a3a",padding:"0.75rem"}}>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.78rem",color:"#8899aa",marginBottom:"0.25rem",letterSpacing:"0.08em"}}>{ex.type.toUpperCase()}</div>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1rem",color:"#ffdd00",marginBottom:"0.3rem"}}>{ex.format}</div>
              <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"0.9rem",color:"#c8d8e8",lineHeight:1.4}}>{ex.desc}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"0.75rem 1.25rem",borderTop:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.84rem",color:"#8899aa"}}>Format hints appear on every question below the answer box</div>
          <button onClick={onClose} style={{...S.btnCyber,whiteSpace:"nowrap"}}>GOT IT →</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LEARN MODE — no timer, scaffolded help, Apex-powered
// ═══════════════════════════════════════════════════════════
function LearnMode({section,book,profile,onComplete,onClose,onSpendLC}){
  const proofs=SECTION_PROOFS[section.id]||[];
  const [qIdx,setQIdx]=useState(0);
  const [input,setInput]=useState("");
  const [flash,setFlash]=useState(null);
  const [helpLevel,setHelpLevel]=useState(0); // 0=none,1=nudge,2=scaffold,3=example
  const [scaffoldText,setScaffoldText]=useState("");
  const [loadingHelp,setLoadingHelp]=useState(false);
  const [correct,setCorrect]=useState([]);
  const [done,setDone]=useState(false);
  const [tabCount,setTabCount]=useState(0);
  const [showWarning,setShowWarning]=useState(false);
  const [streak,setStreak]=useState(0);
  const [xpEarned,setXpEarned]=useState(0);
  const [fluxEarned,setFluxEarned]=useState(0);
  const [showGuide,setShowGuide]=useState(()=>{
    try{return!localStorage.getItem("vanguard_guide_seen");}catch{return true;}
  });
  const inputRef=useRef(null);
  const isShield=profile.name==="CIPHER"; // streak shield for 11yr old

  useTabDetection(true,()=>{
    const n=tabCount+1;setTabCount(n);setShowWarning(true);
    setInput("");setFlash(null);setHelpLevel(0);setScaffoldText("");
  });
  useEffect(()=>{inputRef.current?.focus();},[qIdx]);

  const q=proofs[qIdx];
  const color=book.color;

  function submit(){
    if(!q)return;
    const ok=checkAns(input,q.a);
    setFlash(ok?"good":"bad");
    if(ok){
      const newStreak=streak+1;
      setStreak(newStreak);
      setCorrect(c=>[...c,true]);
      setXpEarned(x=>x+LEARN_XP);
      setFluxEarned(f=>f+LEARN_FLUX);
      setInput("");setHelpLevel(0);setScaffoldText("");
      setTimeout(()=>{
        setFlash(null);
        if(qIdx+1<proofs.length) setQIdx(i=>i+1);
        else setDone(true);
      },500);
    } else {
      // Streak shield: 11yr old doesn't lose streak on first wrong
      if(isShield&&streak>=3&&correct.slice(-1)[0]!==false){
        // Shield absorbs this
        setFlash("shield");
        setTimeout(()=>setFlash(null),800);
      } else {
        setStreak(0);
        setCorrect(c=>[...c,false]);
        setTimeout(()=>setFlash(null),600);
      }
    }
  }

  async function getHelp(level){
    if(!q)return;
    if(level===1){setHelpLevel(1);return;} // free nudge
    if(level===2){
      if(profile.lc<SCAFFOLD_COST){notify("Not enough LC for scaffold","warn");return;}
      onSpendLC(SCAFFOLD_COST);
      setLoadingHelp(true);
      try{
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,system:"You are a math tutor. Give a 2-step scaffold: show step 1, ask student to do step 2. Be encouraging, not giving the answer. Max 3 sentences.",messages:[{role:"user",content:`Question: ${q.q}
Answer: ${q.a}
Give scaffold help.`}]})});
        const d=await res.json();
        setScaffoldText(d.content?.[0]?.text||"Try breaking the problem into smaller steps. What's the first operation you need to do?");
      }catch{setScaffoldText("Try breaking the problem into smaller steps. What operation do you need first?");}
      setLoadingHelp(false);
      setHelpLevel(2);
    }
    if(level===3){
      if(profile.lc<WORKED_EXAMPLE_COST){notify("Not enough LC for worked example","warn");return;}
      onSpendLC(WORKED_EXAMPLE_COST);
      setLoadingHelp(true);
      try{
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:250,system:"Show a SIMILAR but DIFFERENT worked example (not the exact question). Then say 'Now try the original.' Keep it under 4 sentences.",messages:[{role:"user",content:`Question: ${q.q}
Show a similar worked example.`}]})});
        const d=await res.json();
        setScaffoldText(d.content?.[0]?.text||`Similar example: If asked to factor x²-5x+6, find two numbers multiplying to 6 and adding to -5: those are -2 and -3. So it factors as (x-2)(x-3). Now try the original.`);
      }catch{setScaffoldText("Break the problem down step by step, using the same approach you'd use for simpler problems.");}
      setLoadingHelp(false);
      setHelpLevel(3);
    }
  }

  if(done){
    const pct=Math.round((correct.filter(Boolean).length/proofs.length)*100);
    return(
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:`1px solid ${color}55`,padding:"2.5rem",maxWidth:440,textAlign:"center"}}>
          <div style={{fontSize:"3rem",marginBottom:"0.5rem"}}>{pct===100?"🏆":pct>=70?"✅":"📋"}</div>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.2rem",color,marginBottom:"0.5rem"}}>{pct===100?"PERFECT":"SECTION LEARNED"}</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#8899aa",marginBottom:"0.35rem"}}>{correct.filter(Boolean).length}/{proofs.length} correct</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#00ffcc",marginBottom:"0.35rem"}}>+{xpEarned} XP</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#ffdd00",marginBottom:"1.5rem"}}>+{fluxEarned} ⚡ Flux</div>
          <div style={{display:"flex",gap:"0.75rem",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>onComplete(correct)} style={S.btnCyber}>DONE ✓</button>
            <button onClick={onClose} style={S.btnGhost}>BACK</button>
          </div>
        </div>
      </div>
    );
  }
  if(!q) return null;

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      {showWarning&&<TabWarning message={getTabMessage(tabCount)} onDismiss={()=>setShowWarning(false)}/>}
      {showGuide&&<AnswerGuide onClose={()=>{setShowGuide(false);try{localStorage.setItem("vanguard_guide_seen","1");}catch{}}}/>}
      <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:`1px solid ${color}44`,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
        {/* Header */}
        <div style={{padding:"0.9rem 1.25rem",borderBottom:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:color}}/>
          <div>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.92rem",color,letterSpacing:"0.1em"}}>LEARN MODE · {section.num} {section.name}</div>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginTop:"0.1rem"}}>No timer · Ask for help · Build understanding</div>
          </div>
          <div style={{display:"flex",gap:"0.75rem",alignItems:"center"}}>
            {streak>=3&&<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",color:"#ff8800"}}>{streak}🔥{isShield?" 🛡":""}</div>}
            <button onClick={()=>setShowGuide(true)} style={{...S.btnGhost,fontSize:"0.78rem",padding:"0.15rem 0.5rem",borderColor:"#ffdd0033",color:"#ffdd00"}}>? FORMAT</button>
            <button onClick={onClose} style={S.xBtn}>✕</button>
          </div>
        </div>
        {/* Progress */}
        <div style={{display:"flex",gap:3,padding:"0.5rem 1.25rem",borderBottom:"1px solid #1a2a3a"}}>
          {proofs.map((_,i)=><div key={i} style={{flex:1,height:6,background:i<correct.length?(correct[i]?"#00ffcc":"#ff4444"):i===qIdx?color:"#8899aa",transition:"all 0.3s"}}/>)}
        </div>
        {/* XP earned ticker */}
        <div style={{padding:"0.3rem 1.25rem",background:"#040b14",borderBottom:"1px solid #1a2a3a",display:"flex",gap:"1.5rem"}}>
          <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#00ffcc"}}>+{xpEarned} XP</span>
          <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#ffdd00"}}>+{fluxEarned} Flux</span>
          <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa"}}>Q {qIdx+1}/{proofs.length}</span>
        </div>
        {/* Question */}
        <div style={{margin:"0.85rem 1.25rem",padding:"1rem",background:"#040b14",border:`1px solid ${color}22`,borderLeft:`3px solid ${color}`,fontSize:"1.1rem",lineHeight:1.8,color:"#e0eeff",fontFamily:"Rajdhani,sans-serif"}}>{q.q}</div>
        {/* Help display */}
        {helpLevel===1&&<div style={{margin:"0 1.25rem 0.5rem",padding:"0.6rem 0.85rem",background:"#1a1000",border:"1px solid #ffdd0033",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#ffdd00"}}>💡 {q.hint}</div>}
        {helpLevel>=2&&scaffoldText&&<div style={{margin:"0 1.25rem 0.5rem",padding:"0.75rem",background:"#001a30",border:"1px solid #00aaff33",fontFamily:"Rajdhani,sans-serif",fontSize:"0.95rem",lineHeight:1.6,color:"#88ccff"}}>{loadingHelp?"Loading help...":scaffoldText}</div>}
        {flash==="shield"&&<div style={{margin:"0 1.25rem 0.5rem",padding:"0.5rem",background:"#1a0a00",border:"1px solid #ff880044",fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#ff8800",textAlign:"center"}}>🛡 STREAK SHIELD ACTIVATED — try again!</div>}
        {/* Input */}
        {q.a&&getFormatTip(q.a)&&<div style={{margin:"0 1.25rem 0.35rem",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#99aabb",padding:"0.28rem 0.5rem",background:"#060d18",border:"1px solid #1a2a3a"}}>📝 {getFormatTip(q.a)}</div>}
        <div style={{display:"flex",gap:"0.5rem",padding:"0 1.25rem 0.6rem"}}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Your answer (take your time)..."
            style={{...S.ansInput,borderColor:flash==="good"?"#00ffcc":flash==="bad"?"#ff4444":color+"55",transition:"border-color 0.2s"}}/>
          <button onClick={submit} style={{...S.btnCyber,borderColor:color,color,whiteSpace:"nowrap"}}>CHECK</button>
        </div>
        {/* Help buttons */}
        <div style={{display:"flex",gap:"0.90rem",padding:"0 1.25rem 1.25rem",flexWrap:"wrap"}}>
          {helpLevel===0&&<button onClick={()=>getHelp(1)} style={{...S.btnGhost,fontSize:"0.8rem"}}>💡 Nudge (free)</button>}
          {helpLevel<=1&&<button onClick={()=>getHelp(2)} style={{...S.btnGhost,fontSize:"0.8rem",borderColor:"#00aaff44",color:"#00aaff"}}>{loadingHelp?"...":"🔧 Scaffold ("}{!loadingHelp&&`${SCAFFOLD_COST} LC)`}</button>}
          {helpLevel<=2&&<button onClick={()=>getHelp(3)} style={{...S.btnGhost,fontSize:"0.8rem",borderColor:"#aa66ff44",color:"#aa66ff"}}>{loadingHelp?"...":"📖 Example ("}{!loadingHelp&&`${WORKED_EXAMPLE_COST} LC)`}</button>}
          <div style={{flex:1,textAlign:"right",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#aabbcc",paddingTop:"0.35rem"}}>⚡ {profile.lc} LC available</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LIVE MODE — 90 sec timer, Flux rewards, Gimkit-style
// ═══════════════════════════════════════════════════════════
function LiveMode({profile,onExit,onEarn}){
  const [questions]=useState(()=>buildLiveQuestions(profile));
  const [qIdx,setQIdx]=useState(0);
  const [input,setInput]=useState("");
  const [flash,setFlash]=useState(null);
  const [score,setScore]=useState(0);
  const [streak,setStreak]=useState(0);
  const [fluxEarned,setFluxEarned]=useState(0);
  const [fluxPop,setFluxPop]=useState(null);
  const [timeLeft,setTimeLeft]=useState(90);
  const [done,setDone]=useState(false);
  const [showWarning,setShowWarning]=useState(false);
  const [tabCount,setTabCount]=useState(0);
  const [showLiveGuide,setShowLiveGuide]=useState(false);
  const timerRef=useRef(null);
  const inputRef=useRef(null);

  useTabDetection(true,()=>{
    const n=tabCount+1;setTabCount(n);setShowWarning(true);
    setInput("");setFlash(null);setTimeLeft(90);
    // Swap question
    if(qIdx+1<questions.length) setQIdx(i=>i+1);
  });

  useEffect(()=>{
    timerRef.current=setInterval(()=>setTimeLeft(t=>{
      if(t<=1){clearInterval(timerRef.current);handleTimeout();return 0;}return t-1;
    }),1000);
    return()=>clearInterval(timerRef.current);
  },[qIdx]);
  useEffect(()=>{inputRef.current?.focus();},[qIdx]);

  function handleTimeout(){
    setStreak(0);
    advance(false);
  }

  function advance(correct){
    clearInterval(timerRef.current);
    if(done) return;
    if(qIdx+1>=questions.length){
      setDone(true);
      return;
    }
    setTimeout(()=>{setQIdx(i=>i+1);setInput("");setFlash(null);setTimeLeft(90);},correct?400:800);
  }

  function submit(){
    const q=questions[qIdx];if(!q||done)return;
    const ok=checkAns(input,q.a);
    setFlash(ok?"good":"bad");
    if(ok){
      const newStreak=streak+1;
      const multiplier=Math.min(newStreak,5);
      const flux=LIVE_FLUX*multiplier;
      const xp=LIVE_XP;
      setStreak(newStreak);
      setScore(s=>s+10*multiplier);
      setFluxEarned(f=>f+flux);
      setFluxPop(`+${flux}⚡`);
      setTimeout(()=>setFluxPop(null),1000);
      onEarn(xp,flux);
      advance(true);
    } else {
      setStreak(0);
      advance(false);
    }
  }

  if(!questions.length) return(
    <div style={{minHeight:"100vh",background:"#03080f",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"Orbitron,sans-serif",color:"#ff4444",fontSize:"1.2rem"}}>COMPLETE SECTIONS FIRST</div>
      <div style={{fontFamily:"Share Tech Mono,monospace",color:"#8899aa"}}>Live Mode unlocks after completing at least 3 sections in Learn Mode</div>
      <button onClick={onExit} style={S.btnCyber}>BACK</button>
    </div>
  );

  if(done) return(
    <div style={{minHeight:"100vh",background:"#03080f",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#060d18",border:`1px solid ${profile.color}55`,padding:"3rem",textAlign:"center",maxWidth:400}}>
        <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"2rem",fontWeight:900,color:profile.color,marginBottom:"0.5rem"}}>SESSION OVER</div>
        <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"3rem",fontWeight:900,color:"#ffdd00",marginBottom:"0.25rem"}}>{fluxEarned}</div>
        <div style={{fontFamily:"Share Tech Mono,monospace",color:"#ffdd00",marginBottom:"0.5rem"}}>⚡ FLUX EARNED</div>
        <div style={{fontFamily:"Share Tech Mono,monospace",color:"#8899aa",fontSize:"0.94rem",marginBottom:"1.5rem"}}>Score: {score} · Max streak: {streak}</div>
        <button onClick={onExit} style={S.btnCyber}>RETURN TO OS</button>
      </div>
    </div>
  );

  const q=questions[qIdx];
  const color=profile.color;
  const timeColor=timeLeft>45?"#00ffcc":timeLeft>20?"#ffaa00":"#ff4444";
  const streakMult=Math.min(streak+1,5);

  return(
    <div style={{minHeight:"100vh",background:"#03080f",display:"flex",flexDirection:"column",fontFamily:"Rajdhani,sans-serif",position:"relative"}}>
      {showWarning&&<TabWarning message={getTabMessage(tabCount)} onDismiss={()=>setShowWarning(false)}/>}
      {showLiveGuide&&<AnswerGuide onClose={()=>setShowLiveGuide(false)}/>}
      {fluxPop&&<div style={{position:"fixed",top:"40%",left:"50%",transform:"translateX(-50%)",fontFamily:"Orbitron,sans-serif",fontSize:"2.5rem",fontWeight:900,color:"#ffdd00",zIndex:9000,pointerEvents:"none",animation:"fadeUp 1s forwards"}}>
        {fluxPop}
      </div>}
      <Scanlines/>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.7rem 1.5rem",background:"#060d18",borderBottom:`1px solid ${color}33`,flexWrap:"wrap",gap:"0.5rem"}}>
        <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1rem",fontWeight:700,color,letterSpacing:"0.1em"}}>⚡ LIVE MODE</div>
        <div style={{display:"flex",gap:"1.25rem",alignItems:"center",fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem"}}>
          <span>SCORE <b style={{color,fontSize:"1rem"}}>{score}</b></span>
          {streak>=2&&<span style={{color:"#ff8800"}}>{streak}🔥 x{streakMult}</span>}
          <span style={{color:"#ffdd00"}}>⚡{fluxEarned}</span>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
            <div style={{width:80,height:6,background:"#1a2a3a",borderRadius:3}}>
              <div style={{height:"100%",background:timeColor,width:`${(timeLeft/90)*100}%`,transition:"width 0.9s linear",borderRadius:3}}/>
            </div>
            <span style={{color:timeColor,fontWeight:700}}>{timeLeft}s</span>
          </div>
        </div>
        <button onClick={()=>setShowLiveGuide(true)} style={{...S.btnGhost,fontSize:"0.8rem",padding:"0.2rem 0.6rem",borderColor:"#ffdd0033",color:"#ffdd00"}}>? FORMAT</button>
        <button onClick={onExit} style={{...S.btnGhost,fontSize:"0.8rem",padding:"0.2rem 0.6rem",borderColor:"#ff444433",color:"#ff6644"}}>EXIT</button>
      </div>
      {/* Progress bar */}
      <div style={{height:4,background:"#0a1520"}}>
        <div style={{height:"100%",background:color,width:`${(qIdx/questions.length)*100}%`,transition:"width 0.4s"}}/>
      </div>
      {/* Question */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"2rem 1.5rem",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.75rem",display:"flex",justifyContent:"space-between"}}>
          <span>Q {qIdx+1} / {questions.length}</span>
          {streakMult>1&&<span style={{color:"#ff8800",fontWeight:700}}>{streakMult}× FLUX MULTIPLIER 🔥</span>}
        </div>
        <div style={{background:"#060d18",border:`1px solid ${color}33`,borderLeft:`4px solid ${color}`,padding:"1.25rem",marginBottom:"1rem",fontSize:"1.1rem",lineHeight:1.7,color:"#d0e0f0",transition:"border-color 0.2s",boxShadow:flash==="good"?`0 0 20px ${color}33`:flash==="bad"?"0 0 20px #ff444433":"none"}}>
          {q?.q}
        </div>
        {q?.a&&getFormatTip(q.a)&&<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#99aabb",marginBottom:"0.5rem",padding:"0.28rem 0.5rem",background:"#060d18",border:"1px solid #1a2a3a"}}>📝 {getFormatTip(q.a)}</div>}
        <div style={{display:"flex",gap:"0.75rem"}}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Answer fast! 90 seconds..."
            style={{...S.ansInput,fontSize:"1.05rem",borderColor:flash==="good"?"#00ffcc":flash==="bad"?"#ff4444":color+"55",transition:"border-color 0.2s"}}/>
          <button onClick={submit} style={{...S.btnCyber,borderColor:color,color,padding:"0.55rem 1.25rem",whiteSpace:"nowrap"}}>GO!</button>
        </div>
        <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#aabbcc",marginTop:"0.5rem",textAlign:"center"}}>
          Streak bonus: 2🔥=2× · 3🔥=3× · 4🔥=4× · 5🔥=5× Flux
        </div>
      </div>
      <style>{".fadeUp{animation:fadeUp 1s forwards}@keyframes fadeUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-80px)}}"}</style>
    </div>
  );
}

function buildLiveQuestions(profile){
  const done=Object.keys(profile.sectionsDone||{});
  if(done.length<3) return [];
  const all=[];
  done.forEach(sid=>{
    const qs=[...(SECTION_PROOFS[sid]||[])];
    qs.forEach(q=>all.push({...q,sectionId:sid,topic:sid}));
    // Add challenge if exists
    const ch=CHALLENGES[sid];
    if(ch) all.push({...ch,sectionId:sid,topic:sid,isChallenge:true});
  });
  return [...all].sort(()=>Math.random()-0.5).slice(0,20);
}

// ═══════════════════════════════════════════════════════════
// REDEMPTION CENTER
// ═══════════════════════════════════════════════════════════
function RedemptionCenter({profile,rewards,onClose,onRedeem}){
  const [confirming,setConfirming]=useState(null);
  const pending=(profile.pendingRedemptions||[]).filter(r=>r.status==="pending");
  const history=(profile.pendingRedemptions||[]).filter(r=>r.status!=="pending").slice(-5).reverse();
  const flux=profile.flux||0;

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:"1px solid #ffdd0055",width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
        {/* Header */}
        <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#ffdd00,#ff8800)"}}/>
          <div>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.95rem",color:"#ffdd00",letterSpacing:"0.1em"}}>⚡ REDEMPTION CENTER</div>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#99aabb",marginTop:"0.1rem"}}>Your Flux: <b style={{color:"#ffdd00",fontSize:"1rem"}}>{flux}</b></div>
          </div>
          <button onClick={onClose} style={S.xBtn}>✕</button>
        </div>

        {/* Pending */}
        {pending.length>0&&(
          <div style={{padding:"0.75rem 1.25rem",background:"#1a1500",borderBottom:"1px solid #2a2000"}}>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#ff8800",marginBottom:"0.4rem"}}>PENDING PARENT APPROVAL</div>
            {pending.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.4rem 0",borderBottom:"1px solid #2a2000"}}>
                <span style={{fontSize:"1.2rem"}}>{r.emoji}</span>
                <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"0.95rem",color:"#c8d8e8",flex:1}}>{r.label}</span>
                <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#ff8800"}}>⏳ WAITING</span>
              </div>
            ))}
          </div>
        )}

        {/* Rewards grid */}
        <div style={{padding:"1rem 1.25rem"}}>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",letterSpacing:"0.1em",marginBottom:"0.75rem"}}>AVAILABLE REWARDS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"0.90rem"}}>
            {(rewards||DEFAULT_REWARDS).map(r=>{
              const canAfford=flux>=r.flux;
              const alreadyPending=pending.some(p=>p.rewardId===r.id);
              return(
                <div key={r.id} style={{background:canAfford?"#0a1520":"#060d14",border:`1px solid ${canAfford?"#ffdd0033":"#1a2a3a"}`,padding:"0.95rem",opacity:canAfford?1:0.6,transition:"all 0.2s"}}>
                  <div style={{fontSize:"1.75rem",marginBottom:"0.25rem"}}>{r.emoji}</div>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,fontSize:"0.95rem",color:"#d0e0f0",marginBottom:"0.2rem"}}>{r.label}</div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.96rem",color:"#ffdd00",marginBottom:"0.90rem"}}>⚡ {r.flux}</div>
                  {alreadyPending?(
                    <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#ff8800"}}>⏳ Pending approval</div>
                  ):canAfford?(
                    confirming===r.id?(
                      <div style={{display:"flex",gap:"0.4rem"}}>
                        <button onClick={()=>{onRedeem(r);setConfirming(null);}} style={{flex:1,background:"#ffdd00",border:"none",color:"#000",padding:"0.35rem",cursor:"pointer",fontFamily:"Orbitron,sans-serif",fontSize:"0.94rem",fontWeight:700}}>CONFIRM</button>
                        <button onClick={()=>setConfirming(null)} style={{flex:1,...S.btnGhost,fontSize:"0.94rem",padding:"0.35rem"}}>NO</button>
                      </div>
                    ):(
                      <button onClick={()=>setConfirming(r.id)} style={{...S.btnCyber,width:"100%",borderColor:"#ffdd00",color:"#ffdd00",fontSize:"0.90rem",padding:"0.38rem"}}>REDEEM →</button>
                    )
                  ):(
                    <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#aabbcc"}}>Need {r.flux-flux} more Flux</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        {history.length>0&&(
          <div style={{padding:"0 1.25rem 1.25rem"}}>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#aabbcc",letterSpacing:"0.1em",marginBottom:"0.5rem"}}>RECENT REDEMPTIONS</div>
            {history.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.3rem 0",borderBottom:"1px solid #1a2a3a"}}>
                <span>{r.emoji}</span>
                <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"0.9rem",color:"#aabbcc",flex:1}}>{r.label}</span>
                <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:r.status==="approved"?"#00ffcc":"#ff4444"}}>{r.status==="approved"?"✓ APPROVED":"✗ DENIED"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRIME HUNTER
// ═══════════════════════════════════════════════════════════
function PrimeHunterGame({onExit,gameTimeLeft,onTimeUsed}){
  const [score,setScore]=useState(0);const [lives,setLives]=useState(3);
  const [question,setQuestion]=useState(null);const [timeLeft,setTimeLeft]=useState(8);
  const [gameOver,setGameOver]=useState(false);const [feedback,setFeedback]=useState(null);
  const [gameTimeLeft2,setGameTimeLeft2]=useState(gameTimeLeft);
  const timerRef=useRef(null);const sessionStartRef=useRef(Date.now());

  function isPrime(n){if(n<2)return false;for(let i=2;i<=Math.sqrt(n);i++)if(n%i===0)return false;return true;}
  function nextQ(){setQuestion(Math.floor(Math.random()*97)+2);setTimeLeft(8);setFeedback(null);}
  useEffect(()=>{nextQ();},[]);

  // Session timer
  useEffect(()=>{
    const t=setInterval(()=>{
      const elapsed=Date.now()-sessionStartRef.current;
      const remaining=gameTimeLeft-elapsed;
      setGameTimeLeft2(Math.max(0,remaining));
      if(remaining<=0){clearInterval(t);onTimeUsed(elapsed);setGameOver(true);}
    },1000);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    if(gameOver||!question)return;
    timerRef.current=setInterval(()=>setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);handleAnswer(null);return 0;}return t-1;}),1000);
    return()=>clearInterval(timerRef.current);
  },[question,gameOver]);

  function handleAnswer(ans){
    clearInterval(timerRef.current);
    const correct=isPrime(question);const ok=ans===correct;
    if(ok){setScore(s=>s+10+timeLeft*2);setFeedback("CORRECT ✓");}
    else{setLives(l=>{const nl=l-1;if(nl<=0){onTimeUsed(Date.now()-sessionStartRef.current);setGameOver(true);}return nl;});setFeedback(`WRONG — ${question} ${correct?"IS":"IS NOT"} PRIME`);}
    setTimeout(()=>{if(lives>1||ok)nextQ();},900);
  }

  const mins2=Math.floor(gameTimeLeft2/60000),secs2=Math.floor((gameTimeLeft2%60000)/1000);

  return(
    <div style={{minHeight:"100vh",background:"#03080f",display:"flex",flexDirection:"column",fontFamily:"Rajdhani,sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem 1.5rem",background:"#060d18",borderBottom:"1px solid #1a2a3a",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <span style={{fontFamily:"Orbitron,sans-serif",color:"#00ffcc",fontSize:"0.9rem"}}>◈ PRIME HUNTER</span>
        <div style={{display:"flex",gap:"1rem",alignItems:"center"}}>
          <span>SCORE: <b>{score}</b></span>
          <span>{"◆".repeat(lives)}{"◇".repeat(3-lives)}</span>
          <span style={{color:timeLeft<=3?"#ff4444":"#c8d8e8"}}>⏱ {timeLeft}s</span>
          <span style={{color:gameTimeLeft2<60000?"#ff4444":"#8899aa"}}>DAY: {mins2}:{String(secs2).padStart(2,"0")}</span>
        </div>
        <button onClick={()=>{onTimeUsed(Date.now()-sessionStartRef.current);onExit();}} style={{background:"none",border:"1px solid #ff4444",color:"#ff4444",padding:"0.25rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem"}}>EXIT</button>
      </div>
      {gameOver?(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.5rem"}}>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"2rem",fontWeight:900,color:"#ff4444"}}>{gameTimeLeft2<=0?"TIME'S UP":"SYSTEM CRASH"}</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",color:"#00ffcc",fontSize:"1.1rem"}}>SCORE: {score}</div>
          <button onClick={onExit} style={S.btnCyber}>RETURN TO OS</button>
        </div>
      ):(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.25rem",padding:"2rem"}}>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#8899aa",letterSpacing:"0.3em"}}>IS THIS NUMBER PRIME?</div>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"min(7rem,22vw)",fontWeight:900,color:"#00ffcc",textShadow:"0 0 40px #00ffcc55",lineHeight:1}}>{question}</div>
          {feedback&&<div style={{fontFamily:"Share Tech Mono,monospace",padding:"0.5rem 1.5rem",border:"1px solid",color:feedback.startsWith("C")?"#00ffcc":"#ff4444",borderColor:feedback.startsWith("C")?"#00ffcc":"#ff4444",background:feedback.startsWith("C")?"#001a10":"#1a0000"}}>{feedback}</div>}
          <div style={{width:"min(280px,70vw)",height:5,background:"#1a2a3a"}}><div style={{height:"100%",background:`linear-gradient(90deg,${timeLeft<=3?"#ff4444":"#00ffcc"},${timeLeft<=3?"#ff8800":"#0066ff"})`,width:`${(timeLeft/8)*100}%`,transition:"width 0.9s linear"}}/></div>
          <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap",justifyContent:"center"}}>
            <button onClick={()=>handleAnswer(true)} style={{padding:"0.9rem 2rem",fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",fontWeight:700,border:"2px solid #00ffcc",background:"#001a10",color:"#00ffcc",cursor:"pointer"}}>▲ PRIME</button>
            <button onClick={()=>handleAnswer(false)} style={{padding:"0.9rem 2rem",fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",fontWeight:700,border:"2px solid #ff4444",background:"#1a0000",color:"#ff4444",cursor:"pointer"}}>▼ COMPOSITE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APEX COACH
// ═══════════════════════════════════════════════════════════
function ApexCoach({profile,onClose,onDeductCredits}){
  const [input,setInput]=useState(""),[loading,setLoading]=useState(false);
  const [msgs,setMsgs]=useState(profile.chatHistory||[]);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  async function send(){
    if(!input.trim()||loading||profile.lc<APEX_COST)return;
    const um={role:"user",content:input.trim()};
    const updated=[...msgs,um];setMsgs(updated);setInput("");setLoading(true);
    onDeductCredits(APEX_COST,updated);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system:`You are APEX COACH, a Socratic math tutor in Vanguard Math OS. Student: ${profile.name}. Studying AoPS Intro to Algebra and Counting & Probability. RULES: NEVER give direct answers. Guide with ONE question per response. Max 3 sentences. Cyberpunk tone: "operative", "sync your logic", "run the diagnostic". Acknowledge correct steps. Probe the next gap.`,messages:updated})});
      const data=await res.json();
      const reply=data.content?.[0]?.text||"NEURAL LINK ERROR.";
      const nm=[...updated,{role:"assistant",content:reply}];
      setMsgs(nm);onDeductCredits(0,nm);
    }catch{setMsgs(m=>[...m,{role:"assistant",content:"NEURAL LINK DISRUPTED."}]);}
    setLoading(false);
  }
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:"1px solid #ffdd0055",width:"100%",maxWidth:680,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.9rem 1.25rem",borderBottom:"1px solid #1a2a3a",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#ffdd00"}}>
          <span>◈ APEX COACH — NEURAL LINK</span>
          <div style={{display:"flex",gap:"1rem",alignItems:"center"}}>
            <span style={{background:"#1a1500",border:"1px solid #ffdd0066",padding:"0.2rem 0.6rem",fontSize:"0.92rem"}}>⚡ {profile.lc} LC</span>
            <button onClick={onClose} style={S.xBtn}>✕</button>
          </div>
        </div>
        <div style={{padding:"0.35rem 1.25rem",background:"#1a1000",fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#ff8800",borderBottom:"1px solid #2a2000"}}>⚠ SOCRATIC MODE — {APEX_COST} LC/query · No direct answers</div>
        <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.94rem",minHeight:180}}>
          {msgs.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#8899aa"}}><div style={{fontSize:"2.5rem",color:"#ffdd00",marginBottom:"0.5rem"}}>◈</div><p>Neural link established, <b>{profile.name}</b>. Show your work.</p></div>}
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:2}}>
              <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#8899aa"}}>{m.role==="user"?profile.name:"APEX"}</span>
              <div style={{background:m.role==="user"?"#001a10":"#1a1200",border:`1px solid ${m.role==="user"?"#00ffcc33":"#ffdd0033"}`,padding:"0.55rem 0.85rem",maxWidth:"80%",fontSize:"0.96rem",lineHeight:1.5}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}><span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#8899aa"}}>APEX</span><div style={{background:"#1a1200",border:"1px solid #ffdd0033",padding:"0.55rem 0.85rem",color:"#ffdd00",fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem"}}>Processing...</div></div>}
          <div ref={endRef}/>
        </div>
        <div style={{display:"flex",gap:"0.5rem",padding:"0.9rem",borderTop:"1px solid #1a2a3a"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={profile.lc<APEX_COST?"INSUFFICIENT LC":"Show your work or describe the problem..."} disabled={profile.lc<APEX_COST||loading} style={S.ansInput}/>
          <button onClick={send} disabled={profile.lc<APEX_COST||loading||!input.trim()} style={{...S.btnCyber,borderColor:"#ffdd00",color:"#ffdd00",opacity:profile.lc<APEX_COST?0.4:1}}>TRANSMIT</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PARENT MODE
// ═══════════════════════════════════════════════════════════
function ParentMode({profiles,rewards,onClose,onUpdateProfiles,onUpdateRewards,onStartRival}){
  const [pin,setPin]=useState("");
  const [auth,setAuth]=useState(false);
  const [pinErr,setPinErr]=useState(false);
  const [tab,setTab]=useState("summary"); // summary|approvals|rewards|reset
  const [selectedUser,setSelectedUser]=useState("CIPHER");
  const [xpAmt,setXpAmt]=useState("100");
  const [msg,setMsg]=useState(null);
  const [newReward,setNewReward]=useState({label:"",flux:200,emoji:"🎁",category:"custom"});

  function tryPin(){if(pin===PARENT_PIN){setAuth(true);}else{setPinErr(true);setTimeout(()=>setPinErr(false),800);}}

  const allPending=Object.entries(profiles)
    .filter(([,p])=>p&&typeof p==="object"&&"xp" in p)
    .flatMap(([name,p])=>(p.pendingRedemptions||[])
      .filter(r=>r.status==="pending")
      .map(r=>({...r,profileName:name,profileColor:p.color})));

  function approveRedemption(profileName,rid,approved){
    onUpdateProfiles(profileName,p=>({
      ...p,
      pendingRedemptions:(p.pendingRedemptions||[]).map(r=>
        r.id===rid?{...r,status:approved?"approved":"denied"}:r
      ),
    }));
    setMsg(`${approved?"Approved":"Denied"}: ${allPending.find(r=>r.id===rid)?.label}`);
    setTimeout(()=>setMsg(null),2000);
  }

  function addXP(){
    const amt=parseInt(xpAmt)||0;
    onUpdateProfiles(selectedUser,p=>({...p,xp:p.xp+amt,flux:(p.flux||0)+amt}));
    setMsg(`+${amt} XP & Flux → ${selectedUser}`);setTimeout(()=>setMsg(null),2000);
  }

  function addReward(){
    if(!newReward.label.trim()) return;
    const r={...newReward,id:`custom_${Date.now()}`};
    onUpdateRewards([...rewards,r]);
    setNewReward({label:"",flux:200,emoji:"🎁",category:"custom"});
    setMsg("Reward added!");setTimeout(()=>setMsg(null),1500);
  }

  function removeReward(id){onUpdateRewards(rewards.filter(r=>r.id!==id));}

  if(!auth){
    return(
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:"1px solid #ffdd0066",padding:"2.5rem",width:"100%",maxWidth:360,textAlign:"center"}}>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.2rem",color:"#ffdd00",marginBottom:"0.5rem",letterSpacing:"0.1em"}}>PARENT MODE</div>
          {allPending.length>0&&<div style={{background:"#1a1000",border:"1px solid #ff880044",padding:"0.5rem",marginBottom:"1rem",fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#ff8800"}}>⚡ {allPending.length} pending approval{allPending.length!==1?"s":""}</div>}
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryPin()}
            placeholder="PIN" style={{...S.ansInput,textAlign:"center",fontSize:"1.5rem",letterSpacing:"0.5em",marginBottom:"1rem",border:`1px solid ${pinErr?"#ff4444":"#2a3a4a"}`}}/>
          {pinErr&&<div style={{color:"#ff4444",fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",marginBottom:"0.5rem"}}>INCORRECT PIN</div>}
          <div style={{display:"flex",gap:"0.75rem",justifyContent:"center"}}>
            <button onClick={tryPin} style={S.btnCyber}>ENTER</button>
            <button onClick={onClose} style={S.btnGhost}>CANCEL</button>
          </div>
        </div>
      </div>
    );
  }

  const p=profiles[selectedUser];

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#060d18",border:"1px solid #ffdd0066",width:"100%",maxWidth:680,maxHeight:"92vh",overflowY:"auto"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1rem 1.25rem",borderBottom:"1px solid #1a2a3a",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#ffdd00,#ff8800)"}}/>
          <span style={{fontFamily:"Orbitron,sans-serif",color:"#ffdd00",fontSize:"0.95rem",letterSpacing:"0.1em"}}>🔑 PARENT CONTROL CENTER</span>
          <button onClick={onClose} style={S.xBtn}>✕</button>
        </div>

        {msg&&<div style={{padding:"0.6rem 1.25rem",background:"#001a10",fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#00ffcc",borderBottom:"1px solid #1a2a3a"}}>✓ {msg}</div>}

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #1a2a3a"}}>
          {[["summary","📊 SUMMARY"],["approvals",`✅ APPROVALS${allPending.length>0?" ("+allPending.length+")":""}`],["rewards","🎁 REWARDS"],["reset","⚙ TOOLS"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"0.65rem 0.5rem",background:tab===key?"#0a1520":"none",border:"none",borderBottom:tab===key?"2px solid #ffdd00":"2px solid transparent",color:tab===key?"#ffdd00":"#445566",fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",cursor:"pointer",letterSpacing:"0.05em"}}>
              {label}
            </button>
          ))}
        </div>

        {/* SUMMARY TAB */}
        {tab==="summary"&&(
          <div style={{padding:"1.25rem"}}>
            <div style={{display:"flex",gap:"0.75rem",marginBottom:"1.25rem"}}>
              {Object.entries(profiles).filter(([,prof])=>prof&&"xp" in prof).map(([name,prof])=>(
                <button key={name} onClick={()=>setSelectedUser(name)} style={{flex:1,padding:"0.75rem",background:selectedUser===name?`${prof.color}22`:"#0a1520",border:`2px solid ${selectedUser===name?prof.color:"#8899aa"}`,color:prof.color,fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",fontWeight:700,cursor:"pointer"}}>
                  {name}
                </button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.90rem",marginBottom:"1.25rem"}}>
              {[
                ["XP",p.xp,p.color],["FLUX",`⚡${p.flux||0}`,"#ffdd00"],["LC",`⚡${p.lc}`,"#ffdd00"],
                ["SECTIONS",Object.keys(p.sectionsDone||{}).length,"#00ffcc"],
                ["RANK",getRank(p.xp).name,getRank(p.xp).color],
                ["STREAK",`${p.pulse||0}🔥`,"#ff8800"],
                ["TAB SWITCHES",p.tabSwitchToday||0,(p.tabSwitchToday||0)>5?"#ff4444":"#8899aa"],
                ["LAST TEST",p.lastTestDate||"Never","#8899aa"],
                ["NEXT TEST",p.nextTestDate||"Soon","#00aaff"],
              ].map(([label,val,color])=>(
                <div key={label} style={{background:"#040b14",border:"1px solid #1a2a3a",padding:"0.90rem"}}>
                  <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#8899aa",marginBottom:"0.15rem"}}>{label}</div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.95rem",fontWeight:700,color}}>{val}</div>
                </div>
              ))}
            </div>
            {/* Bi-weekly test history */}
            {(p.biweeklyTests||[]).length>0&&(
              <div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.5rem"}}>TEST HISTORY</div>
                {[...(p.biweeklyTests||[])].reverse().slice(0,5).map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:"1rem",padding:"0.4rem 0",borderBottom:"1px solid #1a2a3a",fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem"}}>
                    <span style={{color:"#99aabb"}}>{t.date}</span>
                    <span style={{color:t.score>=80?"#00ffcc":t.score>=60?"#ffaa00":"#ff4444",fontWeight:700}}>{t.score}%</span>
                    {t.weakTopics?.length>0&&<span style={{color:"#ff6644",flex:1}}>Weak: {t.weakTopics.slice(0,3).join(", ")}</span>}
                  </div>
                ))}
              </div>
            )}
            {/* Rival session button */}
            <button onClick={()=>{onStartRival();onClose();}} style={{...S.btnCyber,width:"100%",marginTop:"1rem",borderColor:"#aa66ff",color:"#aa66ff"}}>⚔ START RIVAL SESSION (both kids)</button>
          </div>
        )}

        {/* APPROVALS TAB */}
        {tab==="approvals"&&(
          <div style={{padding:"1.25rem"}}>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.75rem"}}>PENDING REWARD REQUESTS</div>
            {allPending.length===0?(
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#aabbcc",textAlign:"center",padding:"2rem"}}>No pending requests</div>
            ):allPending.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"#0a1520",border:"1px solid #1a2a3a",marginBottom:"0.5rem",flexWrap:"wrap"}}>
                <span style={{fontSize:"1.5rem"}}>{r.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,fontSize:"1rem",color:"#d0e0f0"}}>{r.label}</div>
                  <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:r.profileColor}}>{r.profileName} · ⚡{r.flux} Flux · {r.date}</div>
                </div>
                <div style={{display:"flex",gap:"0.5rem"}}>
                  <button onClick={()=>approveRedemption(r.profileName,r.id,true)} style={{background:"#001a10",border:"1px solid #00ffcc",color:"#00ffcc",padding:"0.3rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem"}}>✓ APPROVE</button>
                  <button onClick={()=>approveRedemption(r.profileName,r.id,false)} style={{background:"#1a0000",border:"1px solid #ff4444",color:"#ff4444",padding:"0.3rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem"}}>✗ DENY</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REWARDS TAB */}
        {tab==="rewards"&&(
          <div style={{padding:"1.25rem"}}>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.75rem"}}>MANAGE REWARDS</div>
            {(rewards||DEFAULT_REWARDS).map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 0",borderBottom:"1px solid #1a2a3a"}}>
                <span style={{fontSize:"1.3rem"}}>{r.emoji}</span>
                <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"0.95rem",color:"#c8d8e8",flex:1}}>{r.label}</span>
                <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.96rem",color:"#ffdd00"}}>⚡{r.flux}</span>
                <button onClick={()=>removeReward(r.id)} style={{background:"none",border:"1px solid #ff444433",color:"#ff6644",padding:"0.2rem 0.5rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem"}}>REMOVE</button>
              </div>
            ))}
            <div style={{marginTop:"1rem",padding:"0.75rem",background:"#040b14",border:"1px solid #1a2a3a"}}>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.5rem"}}>ADD NEW REWARD</div>
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                <input value={newReward.emoji} onChange={e=>setNewReward(r=>({...r,emoji:e.target.value}))} style={{...S.ansInput,width:50,textAlign:"center"}} placeholder="🎁"/>
                <input value={newReward.label} onChange={e=>setNewReward(r=>({...r,label:e.target.value}))} style={{...S.ansInput,flex:1}} placeholder="Reward name..."/>
                <input type="number" value={newReward.flux} onChange={e=>setNewReward(r=>({...r,flux:parseInt(e.target.value)||0}))} style={{...S.ansInput,width:80,textAlign:"center"}} min="50"/>
                <button onClick={addReward} style={S.btnCyber}>ADD</button>
              </div>
            </div>
          </div>
        )}

        {/* TOOLS TAB */}
        {tab==="reset"&&(
          <div style={{padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
            <div style={{display:"flex",gap:"0.75rem",marginBottom:"0.5rem"}}>
              {Object.entries(profiles).filter(([,prof])=>prof&&"xp" in prof).map(([name,prof])=>(
                <button key={name} onClick={()=>setSelectedUser(name)} style={{flex:1,padding:"0.90rem",background:selectedUser===name?`${prof.color}22`:"#0a1520",border:`2px solid ${selectedUser===name?prof.color:"#8899aa"}`,color:prof.color,fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",cursor:"pointer"}}>
                  {name}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
              <input type="number" value={xpAmt} onChange={e=>setXpAmt(e.target.value)} style={{...S.ansInput,width:100,textAlign:"center"}} min="0"/>
              <button onClick={addXP} style={{...S.btnCyber,flex:1}}>➕ ADD XP + FLUX TO {selectedUser}</button>
            </div>
            <button onClick={()=>{onUpdateProfiles(selectedUser,p=>({...p,sectionsToday:0,lastSyncDate:null,gameTimeUsedMs:0,lastGameDate:null,bountyCorrectToday:0,bountyCountToday:0,lastBountyDate:null,tabSwitchToday:0}));setMsg("Daily limits cleared");setTimeout(()=>setMsg(null),2000);}} style={{...S.btnCyber,borderColor:"#7744ff",color:"#7744ff"}}>🔓 CLEAR TODAY'S LIMITS FOR {selectedUser}</button>
            <button onClick={()=>{onClose();setTimeout(()=>window.dispatchEvent(new CustomEvent("triggerTest")),100);}} style={{...S.btnCyber,borderColor:"#00aaff",color:"#00aaff"}}>📝 TRIGGER BI-WEEKLY TEST NOW</button>
            <button onClick={()=>{onUpdateProfiles(selectedUser,_=>({...INIT_P(selectedUser,profiles[selectedUser].color,selectedUser)}));setMsg(`${selectedUser} fully reset`);setTimeout(()=>setMsg(null),2000);}} style={{...S.btnCyber,borderColor:"#ff4444",color:"#ff4444"}}>⚠ FULL RESET {selectedUser}</button>
          </div>
        )}

        <div style={{padding:"0.75rem 1.25rem",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#99aabb",borderTop:"1px solid #1a2a3a"}}>
          PIN: {PARENT_PIN} · Change PARENT_PIN constant in code to update
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CHAPTER VIEW
// ═══════════════════════════════════════════════════════════
function ChapterView({chapter,book,profile,sectionsLeft,onSectionProof,onBack,showCoachBtn,onCoach}){
  const totalSections=chapter.sections.length;
  const doneSecs=chapter.sections.filter(s=>profile.sectionsDone[s.id]).length;
  const chXP=chapter.sections.reduce((a,s)=>{
    const pd=profile.proofsDone[s.id]||[];
    const cd=profile.challengesDone[s.id];
    return a+(profile.sectionsDone[s.id]?SECTION_XP:0)+pd.filter(Boolean).length*PROOF_PASS_XP+(cd?CHALLENGE_XP:0);
  },0);

  return(
    <div style={{minHeight:"100vh",background:"#03080f",fontFamily:"Rajdhani,sans-serif"}}>
      <Scanlines/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"1.25rem"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",paddingBottom:"0.94rem",borderBottom:"1px solid #1a2a3a",flexWrap:"wrap",gap:"0.5rem"}}>
          <button onClick={onBack} style={S.btnBack}>← BOOK</button>
          <span style={{fontFamily:"Orbitron,sans-serif",color:book.color,fontSize:"0.95rem"}}>Ch.{chapter.num} — {chapter.name}</span>
          <div style={{display:"flex",gap:"0.94rem",alignItems:"center"}}>
            <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",background:"#1a1500",border:"1px solid #ffdd0066",color:"#ffdd00",padding:"0.2rem 0.6rem",cursor:"pointer"}} onClick={onCoach}>⚡ {profile.lc} LC</span>
            <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:sectionsLeft>0?"#00ffcc":"#ff4444"}}>SYNCS: {sectionsLeft}/{DAILY_SECTION_LIMIT}</span>
          </div>
        </div>

        {/* Chapter summary bar */}
        <div style={{background:"#040c16",border:`1px solid ${book.color}33`,padding:"0.85rem 1.1rem",marginBottom:"1rem",display:"flex",flexWrap:"wrap",gap:"1.5rem",alignItems:"center"}}>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.2rem"}}>SECTIONS {doneSecs}/{totalSections} · {chXP} XP EARNED</div>
            <div style={{height:4,background:"#1a2a3a"}}><div style={{height:"100%",background:book.color,width:`${(doneSecs/totalSections)*100}%`,transition:"width 0.5s"}}/></div>
          </div>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",textAlign:"right"}}>
            <div>+{SECTION_XP} XP per section</div>
            <div style={{color:"#00ffcc88"}}>+{PROOF_PASS_XP} XP per proof Q</div>
            <div style={{color:"#ffdd0088"}}>+{CHALLENGE_XP} XP challenge</div>
          </div>
        </div>

        {/* Section cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"0.94rem",marginBottom:"1.25rem"}}>
          {chapter.sections.map(sec=>{
            const done=profile.sectionsDone[sec.id];
            const proofs=profile.proofsDone[sec.id]||[];
            const cDone=profile.challengesDone[sec.id];
            const proofTotal=(SECTION_PROOFS[sec.id]||[]).length;
            const proofCorrect=proofs.filter(Boolean).length;
            const hasChallenge=!!CHALLENGES[sec.id];
            const sectionXp=(done?SECTION_XP:0)+proofCorrect*PROOF_PASS_XP+(cDone?CHALLENGE_XP:0);
            const maxXp=SECTION_XP+proofTotal*PROOF_PASS_XP+(hasChallenge?CHALLENGE_XP:0);

            return(
              <div key={sec.id} style={{background:done?`${book.color}08`:"#060d18",border:`1px solid ${done?`${book.color}44`:"#1a2a3a"}`,padding:"0.95rem",position:"relative",overflow:"hidden",transition:"all 0.2s"}}>
                {done&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${book.color},transparent)`}}/>}

                {/* Section number + name */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem",gap:"0.5rem"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:done?book.color:"#aabbcc",letterSpacing:"0.1em",marginBottom:"0.2rem"}}>{sec.num}</div>
                    <div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,fontSize:"0.96rem",color:done?"#d0e8f0":"#7a8a9a",lineHeight:1.3}}>{sec.name}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.95rem",fontWeight:700,color:book.color}}>{sectionXp}</div>
                    <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#aabbcc"}}>/{maxXp} XP</div>
                  </div>
                </div>

                {/* Proof progress */}
                {proofTotal>0&&(
                  <div style={{marginBottom:"0.5rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.2rem"}}>
                      <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#00ffcc88"}}>PROOF Qs</span>
                      <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#00ffcc88"}}>{proofCorrect}/{proofTotal}</span>
                    </div>
                    <div style={{display:"flex",gap:2}}>
                      {Array.from({length:proofTotal},(_,i)=>(
                        <div key={i} style={{flex:1,height:5,background:proofs[i]===true?"#00ffcc":proofs[i]===false?"#ff444466":"#1a2a3a",transition:"all 0.3s"}}/>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenge badge */}
                {hasChallenge&&(
                  <div style={{marginBottom:"0.5rem"}}>
                    <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:cDone?"#ffdd00":"#334455"}}>⚡ CHALLENGE {cDone?"✓":""}</span>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={()=>onSectionProof(sec)}
                  disabled={!done&&sectionsLeft<=0}
                  style={{width:"100%",padding:"0.45rem",background:done?"#001510":"#001a10",border:`1px solid ${done?book.color+"66":sectionsLeft>0?book.color:"#8899aa"}`,color:done?`${book.color}88`:sectionsLeft>0?book.color:"#aabbcc",fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",letterSpacing:"0.05em",cursor:done||sectionsLeft>0?"pointer":"not-allowed",opacity:!done&&sectionsLeft<=0?0.4:1,transition:"all 0.2s"}}>
                  {done?"REVIEW / REDO PROOFS":sectionsLeft<=0?"THROTTLED — COME BACK TOMORROW":"SYNC SECTION + PROOF"}
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={onCoach} style={{background:"#1a1500",border:"1px solid #ffdd0066",color:"#ffdd00",padding:"0.7rem 1.5rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",letterSpacing:"0.1em",width:"100%"}}>
          ◈ NEURAL LINK — APEX COACH ({APEX_COST} LC/query)
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BOOK VIEW
// ═══════════════════════════════════════════════════════════
function BookView({book,profile,sectionsLeft,onChapter,onBack}){
  const allSections=book.chapters.flatMap(c=>c.sections);
  const doneSections=allSections.filter(s=>profile.sectionsDone[s.id]).length;
  const bookXP=allSections.reduce((a,s)=>{
    const pd=profile.proofsDone[s.id]||[];
    const cd=profile.challengesDone[s.id];
    return a+(profile.sectionsDone[s.id]?SECTION_XP:0)+pd.filter(Boolean).length*PROOF_PASS_XP+(cd?CHALLENGE_XP:0);
  },0);

  return(
    <div style={{minHeight:"100vh",background:"#03080f",fontFamily:"Rajdhani,sans-serif"}}>
      <Scanlines/>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"1.25rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem",paddingBottom:"0.94rem",borderBottom:"1px solid #1a2a3a",flexWrap:"wrap",gap:"0.5rem"}}>
          <button onClick={onBack} style={S.btnBack}>← DASHBOARD</button>
          <span style={{fontFamily:"Orbitron,sans-serif",color:book.color,fontSize:"0.9rem",letterSpacing:"0.05em"}}>{book.code} · {book.name}</span>
          <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#8899aa"}}>{doneSections}/{allSections.length} SECTIONS · {bookXP} XP</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"0.95rem"}}>
          {book.chapters.map(ch=>{
            const total=ch.sections.length;
            const done=ch.sections.filter(s=>profile.sectionsDone[s.id]).length;
            const chXP=ch.sections.reduce((a,s)=>{
              const pd=profile.proofsDone[s.id]||[];
              const cd=profile.challengesDone[s.id];
              return a+(profile.sectionsDone[s.id]?SECTION_XP:0)+pd.filter(Boolean).length*PROOF_PASS_XP+(cd?CHALLENGE_XP:0);
            },0);
            return(
              <button key={ch.id} onClick={()=>onChapter(ch)}
                style={{background:"#060d18",border:`1px solid ${done>0?`${book.color}44`:"#1a2a3a"}`,padding:"1.1rem",cursor:"pointer",textAlign:"left",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:done>0?2:1,background:done>0?book.color:"#8899aa",transition:"all 0.3s"}}/>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:book.color,letterSpacing:"0.15em",marginBottom:"0.3rem"}}>CHAPTER {ch.num}</div>
                <div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,fontSize:"0.96rem",color:"#c8d8e8",marginBottom:"0.94rem",lineHeight:1.3}}>{ch.name}</div>
                <div style={{height:4,background:"#1a2a3a",marginBottom:"0.3rem"}}><div style={{height:"100%",background:book.color,width:`${(done/total)*100}%`,transition:"width 0.5s"}}/></div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#8899aa"}}>{done}/{total} sections</span>
                  <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:book.color}}>+{chXP} XP →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function VanguardMathOS(){
  const [appState,setAppState]=useState(()=>{
    const s=loadState();
    if(s) return s;
    return{
      CIPHER:INIT_P("CIPHER","#00ffcc","CIPHER"),
      NOVA:INIT_P("NOVA","#ff44cc","NOVA"),
      rewards:[...DEFAULT_REWARDS],
      rivalSession:null,
    };
  });
  const profiles=appState; // profiles is just appState for compat
  function setProfiles(fn){setAppState(prev=>({...prev,...(typeof fn==="function"?fn(prev):fn)}));}
  const [activeUser,setActiveUser]=useState(null);
  const [activeGame,setActiveGame]=useState(null); // "SLITHER"|"PRIME"
  const [showCoach,setShowCoach]=useState(false);
  const [activeBook,setActiveBook]=useState(null);
  const [activeChapter,setActiveChapter]=useState(null);
  const [proofTarget,setProofTarget]=useState(null); // {section, book}
  const [notification,setNotification]=useState(null);
  const [showArcade,setShowArcade]=useState(false);
  const [showParent,setShowParent]=useState(false);
  const [showBounty,setShowBounty]=useState(false);
  const [showLearnMode,setShowLearnMode]=useState(null); // section obj or null
  const [showRedemption,setShowRedemption]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [rivalPending,setRivalPending]=useState(false);

  useEffect(()=>{saveState(appState);},[appState]);
  useEffect(()=>{
    function onTriggerTest(){setActiveGame("BIWEEKLY");}
    window.addEventListener("triggerTest",onTriggerTest);
    return()=>window.removeEventListener("triggerTest",onTriggerTest);
  },[]);

  function notify(msg,type="info"){setNotification({msg,type});setTimeout(()=>setNotification(null),3500);}
  function updateProfile(name,fn){setProfiles(prev=>({...prev,[name]:fn(prev[name])}));}

  function getProfile(name){
    const p=profiles[name];const t=today();
    let updated={...p};
    let changed=false;
    // Reset daily section limit
    if(p.lastSyncDate!==t){
      const yest=new Date();yest.setDate(yest.getDate()-1);const ys=yest.toISOString().slice(0,10);
      updated={...updated,sectionsToday:0,lastSyncDate:t,
        pulse:p.lastActive===ys?(p.pulse||0)+1:p.lastActive===t?p.pulse:0};
      changed=true;
    }
    // Reset game time used daily
    if(p.lastGameDate!==t){
      updated={...updated,gameTimeUsedMs:0,lastGameDate:t};
      changed=true;
    }
    // Reset bounty daily counters
    if(p.lastBountyDate!==t){
      updated={...updated,bountyCorrectToday:0,bountyCountToday:0,lastBountyDate:t,
        };
      changed=true;
    }
    if(changed){setProfiles(prev=>({...prev,[name]:updated}));return updated;}
    return p;
  }

  function completeSection(section,book,proofResults,challengeDone){
    const p=getProfile(activeUser);const t=today();
    const alreadyDone=p.sectionsDone[section.id];
    const proofCorrect=(proofResults||[]).filter(Boolean).length;
    const proofXp=proofCorrect*PROOF_PASS_XP;
    const challengeXp=challengeDone?CHALLENGE_XP:0;

    let xpGain=proofXp+challengeXp;
    let newSectionsToday=p.sectionsToday||0;

    if(!alreadyDone){
      xpGain+=SECTION_XP;
      newSectionsToday++;
      if(newSectionsToday>DAILY_SECTION_LIMIT){notify("BANDWIDTH THROTTLED — Max 4 sections/day","warn");return;}
    }

    updateProfile(activeUser,prev=>({
      ...prev,
      xp:prev.xp+xpGain,
      flux:(prev.flux||0)+(alreadyDone?0:SECTION_FLUX),
      lc:prev.lc+(alreadyDone?0:5),
      sectionsToday:newSectionsToday,
      lastSyncDate:t,lastActive:t,
      sectionsDone:{...prev.sectionsDone,[section.id]:true},
      proofsDone:{...prev.proofsDone,[section.id]:proofResults||[]},
      challengesDone:{...prev.challengesDone,[section.id]:challengeDone||false},
    }));

    const parts=[];
    if(!alreadyDone)parts.push(`+${SECTION_XP} section XP`);
    if(proofXp>0)parts.push(`+${proofXp} proof XP`);
    if(challengeXp>0)parts.push(`+${challengeXp} challenge XP!`);
    notify(parts.join(" · ")||"Section reviewed","success");
    setProofTarget(null);
  }

  function deductCredits(amt,hist){updateProfile(activeUser,prev=>({...prev,lc:Math.max(0,prev.lc-amt),chatHistory:hist||prev.chatHistory}));}

  function handleLiveEarn(xp,flux){
    updateProfile(activeUser,prev=>({...prev,xp:prev.xp+xp,flux:(prev.flux||0)+flux,lc:prev.lc+1}));
  }

  function handleBaselineComplete(score,weakTopics){
    updateProfile(activeUser,prev=>({
      ...prev,
      baselineComplete:true,
      baselineScore:score,
      baselineWeakTopics:weakTopics||[],
    }));
    setActiveGame(null);
    notify(`Baseline complete! Score: ${score}% · Curriculum adjusted`,"success");
  }

  function handleTestComplete(score,weakTopics){
    const t=today();
    const nextTest=new Date();nextTest.setDate(nextTest.getDate()+TEST_INTERVAL_DAYS);
    const bonus=score>=90?300:score>=75?150:0;
    updateProfile(activeUser,prev=>({
      ...prev,
      xp:prev.xp+(bonus>0?bonus:0),
      flux:(prev.flux||0)+(bonus>0?Math.floor(bonus/2):0),
      biweeklyTests:[...(prev.biweeklyTests||[]),{date:t,score,weakTopics:weakTopics||[]}],
      lastTestDate:t,
      nextTestDate:nextTest.toISOString().slice(0,10),
    }));
    setActiveGame(null);
    if(bonus>0) notify(`Test complete! ${score}% · +${bonus} XP bonus!`,"success");
    else notify(`Test complete! ${score}% · Keep building those foundations`,"info");
  }

  function handleRedeem(reward){
    const id=`r_${Date.now()}`;
    updateProfile(activeUser,prev=>({
      ...prev,
      flux:Math.max(0,(prev.flux||0)-reward.flux),
      pendingRedemptions:[...(prev.pendingRedemptions||[]),{
        id,rewardId:reward.id,label:reward.label,
        flux:reward.flux,emoji:reward.emoji,
        date:today(),status:"pending"
      }],
    }));
    notify(`Requested: ${reward.emoji} ${reward.label} — waiting for parent approval`,"info");
  }

  function handleBountyCorrect(xp,isCorrect){
    const t=today();
    updateProfile(activeUser,prev=>({
      ...prev,
      xp:prev.xp+xp,
      flux:(prev.flux||0)+(isCorrect?BOUNTY_FLUX:0),
      lc:prev.lc+(isCorrect?2:0),
      bountyCorrectToday:(prev.lastBountyDate===t?(prev.bountyCorrectToday||0):0)+(isCorrect?1:0),
      bountyCountToday:(prev.lastBountyDate===t?(prev.bountyCountToday||0):0)+1,
      lastBountyDate:t,
    }));
  }

  function onGameTimeUsed(ms){
    updateProfile(activeUser,prev=>({...prev,gameTimeUsedMs:(prev.gameTimeUsedMs||0)+ms,lastGameDate:today()}));
  }

  // Game time: base 5min + 2min per bounty correct, max 30min
  const p=activeUser?getProfile(activeUser):null;
  const gameTimeUsed=p?(p.lastGameDate===today()?p.gameTimeUsedMs||0:0):0;
  const earnedMins=p?getEarnedGameMins(p):0;
  const gameTimeLimitMs=earnedMins*60*1000;
  const gameTimeLeft=Math.max(0,gameTimeLimitMs-gameTimeUsed);

  if(activeGame==="SLITHER") return<SlitherGame onExit={()=>setActiveGame(null)} gameTimeLeft={gameTimeLeft} onTimeUsed={onGameTimeUsed}/>;
  if(activeGame==="LIVE") return<LiveMode profile={p} profiles={profiles} onExit={()=>setActiveGame(null)} onEarn={handleLiveEarn} rivalSession={appState.rivalSession}/>;
  if(activeGame==="BASELINE") return<BaselineAssessment profile={p} onComplete={(score,weak)=>handleBaselineComplete(score,weak)} />;
  if(activeGame==="BIWEEKLY") return<BiweeklyTest profile={p} onComplete={(score,weak)=>handleTestComplete(score,weak)}/>;
  if(activeGame==="PRIME") return<PrimeHunterGame onExit={()=>setActiveGame(null)} gameTimeLeft={gameTimeLeft} onTimeUsed={onGameTimeUsed}/>;

  const otherUser=activeUser==="CIPHER"?"NOVA":"CIPHER";
  const op=(activeUser&&profiles[otherUser]&&'xp' in profiles[otherUser])?profiles[otherUser]:{xp:0,color:'#556677',name:otherUser,pulse:0,flux:0};

  // ── LOGIN ──
  if(!activeUser){
    return(
      <div style={{minHeight:"100vh",background:"#03080f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"2.5rem",padding:"2rem",backgroundImage:"radial-gradient(ellipse at 50% 0%,#001833 0%,#03080f 60%)",fontFamily:"Rajdhani,sans-serif",position:"relative"}}>
        <Scanlines/>
        <button onClick={()=>setShowParent(true)} style={{position:"absolute",top:"1rem",right:"1rem",background:"none",border:"1px solid #223344",color:"#aabbcc",padding:"0.3rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",letterSpacing:"0.1em"}}>🔑 PARENT</button>
        
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"clamp(2rem,8vw,4rem)",fontWeight:900,color:"#00ffcc",letterSpacing:"0.2em",textShadow:"0 0 40px #00ffcc33"}}>VANGUARD</div>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"clamp(0.7rem,3vw,1.2rem)",color:"#aabbcc",letterSpacing:"0.4em",marginTop:"0.25rem"}}>MATH OS</div>
          <div style={{fontFamily:"Share Tech Mono,monospace",color:"#8899aa",fontSize:"0.90rem",letterSpacing:"0.25em",marginTop:"0.4rem"}}>AoPS TACTICAL INTERFACE · v6.0</div>
        </div>
        <div style={{display:"flex",gap:"2rem",flexWrap:"wrap",justifyContent:"center"}}>
          {Object.entries(profiles).filter(([name,prof])=>prof&&typeof prof==="object"&&"xp" in prof).map(([name,prof])=>{
            const rank=getRank(prof.xp);
            const totalSecs=CURRICULUM.flatMap(b=>b.chapters).flatMap(c=>c.sections).length;
            const doneSecs=Object.keys(prof.sectionsDone||{}).length;
            return(
              <button key={name} onClick={()=>setActiveUser(name)}
                style={{background:"#060d18",border:`1px solid ${prof.color}33`,padding:"1.75rem 2.25rem",cursor:"pointer",minWidth:210,textAlign:"center",position:"relative",overflow:"hidden",fontFamily:"Rajdhani,sans-serif"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:prof.color,opacity:0.6}}/>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:rank.color,letterSpacing:"0.2em",marginBottom:"0.4rem"}}>{rank.name}</div>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.7rem",fontWeight:900,color:prof.color,marginBottom:"0.4rem"}}>{name}</div>
                <div style={{fontSize:"1.2rem",fontWeight:700,color:"#c8d8e8",marginBottom:"0.2rem"}}>{prof.xp} XP</div>
                <div style={{fontSize:"0.92rem",color:"#ff8800",marginBottom:"0.94rem"}}>PULSE {prof.pulse||0} 🔥</div>
                <div style={{height:3,background:"#1a2a3a",marginBottom:"0.90rem"}}><div style={{height:"100%",background:prof.color,width:`${Math.min(100,(prof.xp%500)/5)}%`}}/></div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#8899aa",marginBottom:"0.2rem"}}>{doneSecs}/{totalSecs} SECTIONS</div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:prof.xp>=PRIME_HUNTER_COST?"#00ffcc":"#445566",marginBottom:"0.35rem"}}>{prof.xp>=PRIME_HUNTER_COST?"✓ ARCADE UNLOCKED":`${Math.max(0,PRIME_HUNTER_COST-prof.xp)} XP TO ARCADE`}</div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#ffdd0088",marginBottom:"0.94rem"}}>⚡ {getEarnedGameMins(prof)}min game time earned today</div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:prof.color}}>BOOT SESSION →</div>
              </button>
            );
          })}
        </div>
        <style>{GCSS}</style>
      </div>
    );
  }

  // ── BOOK VIEW ──
  if(activeBook&&!activeChapter){
    const book=CURRICULUM.find(b=>b.id===activeBook);
    const sectionsLeft=DAILY_SECTION_LIMIT-(p.sectionsToday||0);
    return<>
      <BookView book={book} profile={p} sectionsLeft={sectionsLeft} onChapter={ch=>{setActiveChapter(ch);}} onBack={()=>setActiveBook(null)}/>
      {showCoach&&<ApexCoach profile={p} onClose={()=>setShowCoach(false)} onDeductCredits={deductCredits}/>}
      {notification&&<Toast n={notification}/>}
      <style>{GCSS}</style>
    </>;
  }

  // ── CHAPTER VIEW ──
  if(activeBook&&activeChapter){
    const book=CURRICULUM.find(b=>b.id===activeBook);
    const sectionsLeft=DAILY_SECTION_LIMIT-(p.sectionsToday||0);
    return<>
      <ChapterView chapter={activeChapter} book={book} profile={p} sectionsLeft={sectionsLeft}
        onSectionProof={sec=>setProofTarget({section:sec,book})}
        onBack={()=>setActiveChapter(null)}
        onCoach={()=>setShowCoach(true)}/>
      {showCoach&&<ApexCoach profile={p} onClose={()=>setShowCoach(false)} onDeductCredits={deductCredits}/>}
      {proofTarget&&(
        <ProofModal
          section={proofTarget.section} book={proofTarget.book}
          existingProofs={p.proofsDone[proofTarget.section.id]||[]}
          existingChallenge={p.challengesDone[proofTarget.section.id]||null}
          onComplete={(proofResults,challengeDone)=>completeSection(proofTarget.section,proofTarget.book,proofResults,challengeDone)}
          onClose={()=>setProofTarget(null)}
        />
      )}
      {notification&&<Toast n={notification}/>}
      <style>{GCSS}</style>
    </>;
  }

  // ── ARCADE ──
  if(showArcade){
    const gameMinLeft=Math.floor(gameTimeLeft/60000);
    const games=[
      {key:"PRIME",label:"◈ PRIME HUNTER",cost:PRIME_HUNTER_COST,color:"#00ffcc",desc:"Rapid-fire prime vs composite. 8s per question. Mental math under pressure.",type:"math"},

      {key:"LIVE",label:"⚡ LIVE MODE",cost:LIVE_MODE_COST,color:"#aa66ff",desc:"Gimkit-style! Answer questions from YOUR curriculum. Streak multipliers. Earn Flux. The main event.",type:"math"},
      {key:"SLITHER",label:"◈ SLITHER",cost:SLITHER_COST,color:"#00ffcc",desc:"Slither.io — grow by eating food, avoid bots. Earned by doing math.",type:"fun"},
    ];
    return(
      <div style={{minHeight:"100vh",background:"#03080f",fontFamily:"Rajdhani,sans-serif"}}>
        <Scanlines/>{notification&&<Toast n={notification}/>}
        <div style={{maxWidth:860,margin:"0 auto",padding:"1.5rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem",paddingBottom:"0.94rem",borderBottom:"1px solid #1a2a3a",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem"}}>
            <button onClick={()=>setShowArcade(false)} style={S.btnBack}>← OS</button>
            <span style={{color:p.color}}>◈ ARCADE · {activeUser} · {p.xp} XP</span>
            <div style={{display:"flex",gap:"0.94rem",alignItems:"center"}}>
              <span style={{color:gameTimeLeft<300000?"#ff4444":"#8899aa"}}>⏱ {gameMinLeft}min left</span>
              <button onClick={()=>{setShowArcade(false);setShowBounty(true);}} style={{...S.btnGhost,borderColor:"#ffdd0066",color:"#ffdd00",fontSize:"0.96rem",padding:"0.2rem 0.65rem"}}>⚡ EARN TIME</button>
            </div>
          </div>
          {gameTimeLeft<=0&&(
            <div style={{background:"#1a1000",border:"1px solid #ffdd0033",padding:"0.75rem 1.25rem",marginBottom:"1rem",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#ffdd00"}}>
              ⚡ NO GAME TIME — Answer bounty questions to earn up to {MAX_GAME_MINS} min/day. Each correct = +{MINS_PER_BOUNTY_CORRECT} min.
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"1.5rem"}}>
            {games.map(g=>{
              const unlocked=p.xp>=g.cost&&gameTimeLeft>0;
              const xpLocked=p.xp<g.cost;
              const c=g.color||"#00ffcc";
              return(
                <div key={g.key} style={{background:"#060d18",border:`1px solid ${unlocked?c+"33":"#1a2a3a"}`,padding:"1.5rem",position:"relative",overflow:"hidden",opacity:unlocked?1:0.6,transition:"opacity 0.2s"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:unlocked?c:"#1a2a3a"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
                    <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:unlocked?c+"88":"#334455"}}>{g.cost} XP · {g.type==="math"?"MATH GAME":"RECREATION"}</div>
                    {g.type==="math"&&<span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",background:"#001a10",border:"1px solid #00ffcc22",color:"#00ffcc88",padding:"0.1rem 0.4rem"}}>+XP potential</span>}
                  </div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.1rem",fontWeight:700,color:unlocked?c:"#334455",marginBottom:"0.90rem"}}>{g.label}</div>
                  <div style={{fontSize:"0.95rem",color:"#8899aa",marginBottom:"1.1rem",lineHeight:1.5}}>{g.desc}</div>
                  {unlocked
                    ?<button style={{...S.btnCyber,borderColor:c,color:c}} onClick={()=>{setShowArcade(false);if(g.key==="LIVE"){setActiveGame("LIVE");}else{setActiveGame(g.key);}}}>LAUNCH ▶</button>
                    :<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#ff4444",padding:"0.45rem",border:"1px solid #ff444433",background:"#1a0000"}}>
                      {xpLocked?`LOCKED — ${g.cost-p.xp} XP needed`:`NO GAME TIME — solve bounties to earn time`}
                    </div>}
                </div>
              );
            })}
          </div>
        </div>
        <style>{GCSS}</style>
      </div>
    );
  }

  // ── DASHBOARD ──
  const sectionsLeft=DAILY_SECTION_LIMIT-(p.sectionsToday||0);
  const isToday=p.lastBountyDate===today();
  const bountyCorrect=isToday?(p.bountyCorrectToday||0):0;
  const rank=getRank(p.xp);
  const nextRank=getNextRank(p.xp);
  const totalSections=CURRICULUM.flatMap(b=>b.chapters).flatMap(c=>c.sections).length;
  const doneSections=Object.keys(p.sectionsDone||{}).length;
  const gameMinLeft=Math.floor(gameTimeLeft/60000);
  const gamePct=gameTimeLimitMs>0?gameTimeLeft/gameTimeLimitMs:0;
  const gameColor=gamePct>0.5?"#00ffcc":gamePct>0.25?"#ffaa00":"#ff4444";
  const flux=p.flux||0;
  const pendingCount=(p.pendingRedemptions||[]).filter(r=>r.status==="pending").length;

  // Check if bi-weekly test is due
  const testDue=p.nextTestDate&&today()>=p.nextTestDate;
  // Check if baseline needed
  const baselineNeeded=!p.baselineComplete;

  // Daily quest for 11yr old (CIPHER)
  const isGamey=p.name==="CIPHER";
  const questFlux=200; // 15min TV target
  const questProgress=Math.min(flux,questFlux); // simplified: today's flux

  return(
    <div style={{minHeight:"100vh",background:"#03080f",fontFamily:"Rajdhani,sans-serif"}}>
      <Scanlines/>
      {notification&&<Toast n={notification}/>}
      {showCoach&&<ApexCoach profile={p} onClose={()=>setShowCoach(false)} onDeductCredits={deductCredits}/>}
      {showParent&&<ParentMode profiles={profiles} rewards={appState.rewards||DEFAULT_REWARDS} onClose={()=>setShowParent(false)} onUpdateProfiles={updateProfile} onUpdateRewards={(r)=>setAppState(prev=>({...prev,rewards:r}))} onStartRival={()=>setRivalPending(true)}/>}
      {showBounty&&<BountyBoard profile={p} onClose={()=>setShowBounty(false)} onCorrect={handleBountyCorrect} onSpendLC={(amt)=>updateProfile(activeUser,prev=>({...prev,lc:Math.max(0,prev.lc-amt)}))}/>}
      {showRedemption&&<RedemptionCenter profile={p} rewards={appState.rewards||DEFAULT_REWARDS} onClose={()=>setShowRedemption(false)} onRedeem={handleRedeem}/>}

      <div style={{maxWidth:1000,margin:"0 auto",padding:"1.25rem 1rem"}}>

        {/* ── BASELINE GATE ── */}
        {baselineNeeded&&(
          <div style={{background:"#0a1520",border:"2px solid "+p.color,padding:"1.25rem",marginBottom:"1.25rem",textAlign:"center"}}>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.1rem",color:p.color,marginBottom:"0.5rem",letterSpacing:"0.1em"}}>CALIBRATION REQUIRED</div>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#8899aa",marginBottom:"1rem"}}>Take your baseline assessment so we can personalise your curriculum. ~45 min, one time only.</div>
            <button onClick={()=>setActiveGame("BASELINE")} style={{...S.btnCyber,borderColor:p.color,color:p.color,fontSize:"1rem",padding:"0.65rem 2rem"}}>START BASELINE ASSESSMENT →</button>
          </div>
        )}

        {/* ── TEST DUE ALERT ── */}
        {testDue&&!baselineNeeded&&(
          <div style={{background:"#1a0a00",border:"2px solid #ff8800",padding:"0.85rem 1.25rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.5rem"}}>
            <div>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",color:"#ff8800"}}>BI-WEEKLY TEST DUE</div>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#99aabb"}}>Auto-generated from your last 2 weeks · 15 questions</div>
            </div>
            <button onClick={()=>setActiveGame("BIWEEKLY")} style={{...S.btnCyber,borderColor:"#ff8800",color:"#ff8800",padding:"0.4rem 1.25rem"}}>TAKE TEST →</button>
          </div>
        )}

        {/* ── TOP BAR ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem",flexWrap:"wrap",gap:"0.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <div>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.5rem",fontWeight:900,color:rank.color,lineHeight:1}}>{activeUser}</div>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:rank.color,marginTop:"0.15rem",letterSpacing:"0.1em"}}>{rank.name}{p.pulse>0?` · ${p.pulse}🔥`:""}</div>
            </div>
            {nextRank&&(
              <div style={{paddingLeft:"1rem",borderLeft:"1px solid #1a2a3a"}}>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#8899aa",marginBottom:"0.2rem"}}>→ {nextRank.name}</div>
                <div style={{width:100,height:5,background:"#1a2a3a",borderRadius:2}}>
                  <div style={{height:"100%",background:rank.color,width:`${Math.min(100,((p.xp-(rank.min||0))/(nextRank.min-(rank.min||0)))*100)}%`,borderRadius:2,transition:"width 0.5s"}}/>
                </div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#99aabb",marginTop:"0.1rem"}}>{nextRank.min-p.xp} XP</div>
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={()=>setShowRedemption(true)} style={{background:"#1a1500",border:"1px solid #ffdd0066",color:"#ffdd00",padding:"0.3rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",borderRadius:2,position:"relative"}}>
              ⚡ {flux} FLUX{pendingCount>0?` · ${pendingCount}⏳`:""}
            </button>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",color:"#8899aa"}}>{p.xp} XP</div>
            <div style={{width:1,height:20,background:"#1a2a3a",margin:"0 0.25rem"}}/>
            <button onClick={()=>setShowParent(true)} style={{...S.btnGhost,fontSize:"0.8rem",padding:"0.2rem 0.6rem"}}>🔑{pendingCount>0?` (${pendingCount})`:" PARENT"}</button>
            <button onClick={()=>{setActiveUser(null);}} style={{...S.btnGhost,fontSize:"0.8rem",padding:"0.2rem 0.6rem"}}>OUT</button>
          </div>
        </div>

        {/* ── DAILY QUEST CARD (11yr old / CIPHER) ── */}
        {isGamey&&(
          <div style={{background:"linear-gradient(135deg,#0a1520,#060d18)",border:"1px solid "+rank.color+"44",padding:"1rem 1.25rem",marginBottom:"1rem",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${rank.color},transparent)`}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"0.5rem"}}>
              <div>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.94rem",color:rank.color,letterSpacing:"0.1em",marginBottom:"0.2rem"}}>TODAY'S QUEST</div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#c8d8e8",marginBottom:"0.35rem"}}>
                  Earn <b style={{color:"#ffdd00"}}>200 Flux</b> → unlock <b style={{color:"#ffdd00"}}>15 min TV 📺</b>
                </div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#99aabb"}}>
                  How: sync 2 sections (+20⚡ each) + 8 bounty questions (+15⚡ each)
                </div>
              </div>
              <button onClick={()=>setShowRedemption(true)} style={{...S.btnCyber,borderColor:"#ffdd00",color:"#ffdd00",fontSize:"0.8rem",padding:"0.3rem 0.85rem",whiteSpace:"nowrap"}}>REDEEM →</button>
            </div>
            <div style={{height:8,background:"#0a1520",borderRadius:4,marginTop:"0.75rem",overflow:"hidden"}}>
              <div style={{height:"100%",background:`linear-gradient(90deg,#ffdd00,#ff8800)`,width:`${Math.min(100,(questProgress/questFlux)*100)}%`,borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#99aabb",marginTop:"0.3rem"}}>{questProgress}/{questFlux} ⚡ Flux earned today</div>
          </div>
        )}

        {/* ── GAME TIME BAR ── */}
        <div style={{background:"#060d18",border:"1px solid #1a2a3a",borderLeft:`3px solid ${gameColor}`,padding:"0.9rem 1.25rem",marginBottom:"1rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem",flexWrap:"wrap",gap:"0.5rem"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:"0.5rem"}}>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"2rem",fontWeight:900,color:gameColor,lineHeight:1}}>{gameMinLeft}</span>
              <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#99aabb"}}>/ {earnedMins} min game time left</span>
            </div>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",color:"#aabbcc",textAlign:"right"}}>
              <div>{p.sectionsToday||0} sections = <span style={{color:"#00ffcc"}}>{Math.min(MAX_GAME_MINS,(p.sectionsToday||0)*MINS_PER_SECTION)}m</span></div>
              <div>{bountyCorrect} bounties = <span style={{color:"#ffdd00"}}>{Math.min(MAX_GAME_MINS,bountyCorrect*MINS_PER_BOUNTY_CORRECT)}m</span></div>
            </div>
          </div>
          <div style={{height:7,background:"#0a1520",borderRadius:4,overflow:"hidden",marginBottom:"0.5rem"}}>
            <div style={{height:"100%",background:`linear-gradient(90deg,${gameColor},${gameColor}88)`,width:`${gamePct*100}%`,borderRadius:4,transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
            <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#8899aa"}}>
              {sectionsLeft>0?`${sectionsLeft} section sync${sectionsLeft!==1?"s":""} left`:"Limit reached"} · {BOUNTY_DAILY_CAP-(isToday?(p.bountyCountToday||0):0)} bounties left
            </div>
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
              <button onClick={()=>setShowBounty(true)} style={{background:"#1a1500",border:"1px solid #ffdd0066",color:"#ffdd00",padding:"0.3rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",borderRadius:2}}>⚡ BOUNTY</button>
              <button onClick={()=>setShowArcade(true)} style={{...S.btnCyber,padding:"0.3rem 0.85rem",fontSize:"0.8rem"}}>▶ ARCADE</button>
              <button onClick={()=>p.xp>=LIVE_MODE_COST?setActiveGame("LIVE"):notify("Earn "+LIVE_MODE_COST+" XP to unlock Live Mode","warn")} style={{...S.btnCyber,padding:"0.3rem 0.85rem",fontSize:"0.8rem",borderColor:p.xp>=LIVE_MODE_COST?"#aa66ff":"#2a3a4a",color:p.xp>=LIVE_MODE_COST?"#aa66ff":"#334455"}}>⚡ LIVE MODE</button>
            </div>
          </div>
        </div>

        {/* ── RIVALRY BAR ── */}
        <div style={{background:"#060d18",border:"1px solid #1a2a3a",padding:"0.85rem 1.25rem",marginBottom:"1rem"}}>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#8899aa",letterSpacing:"0.1em",marginBottom:"0.90rem"}}>RIVALRY</div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
            <div style={{textAlign:"center",minWidth:70}}>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",fontWeight:700,color:p.color}}>{activeUser}</div>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#c8d8e8"}}>{p.xp} XP</div>
            </div>
            <div style={{flex:1,position:"relative",height:22,background:"#0a1520",borderRadius:3,overflow:"hidden",minWidth:100}}>
              {(()=>{const total=p.xp+op.xp||1;const pPct=(p.xp/total)*100;return<>
                <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pPct}%`,background:p.color,opacity:0.7,transition:"width 0.5s"}}/>
                <div style={{position:"absolute",right:0,top:0,height:"100%",width:`${100-pPct}%`,background:op.color,opacity:0.7,transition:"width 0.5s"}}/>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Orbitron,sans-serif",fontSize:"0.90rem",fontWeight:700,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.9)"}}>
                  {p.xp>op.xp?`▲ ${p.xp-op.xp}`:p.xp<op.xp?`▼ ${op.xp-p.xp}`:"TIED"}
                </div>
              </>})()}
            </div>
            <div style={{textAlign:"center",minWidth:70}}>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.9rem",fontWeight:700,color:op.color}}>{otherUser}</div>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:"#c8d8e8"}}>{op.xp} XP</div>
            </div>
          </div>
        </div>

        {/* ── COMPACT STATS ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0.5rem",marginBottom:"1rem"}}>
          {[
            {label:"SECTIONS",val:`${doneSections}/${totalSections}`,color:"#00ffcc",sub:"done"},
            {label:"SYNCS TODAY",val:`${p.sectionsToday||0}/${DAILY_SECTION_LIMIT}`,color:sectionsLeft>0?"#00aaff":"#ff4444",sub:`${sectionsLeft} left`},
            {label:"BOUNTIES",val:`${bountyCorrect}/${BOUNTY_DAILY_CAP}`,color:"#ffdd00",sub:"correct"},
            {label:"STREAK",val:`${p.pulse||0}🔥`,color:"#ff8800",sub:"days"},
          ].map(s=>(
            <div key={s.label} style={{background:"#060d18",border:"1px solid #1a2a3a",padding:"0.65rem 0.75rem"}}>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.94rem",color:"#99aabb",marginBottom:"0.2rem"}}>{s.label}</div>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.2rem",fontWeight:700,color:s.color,lineHeight:1,marginBottom:"0.1rem"}}>{s.val}</div>
              <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#aabbcc"}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── MISSION NODES ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.65rem"}}>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1rem",color:"#e0eeff",letterSpacing:"0.1em",fontWeight:700}}>MISSION NODES</div>
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={()=>setShowCoach(true)} style={{...S.btnGhost,fontSize:"0.90rem",padding:"0.25rem 0.65rem",borderColor:"#ffdd0044",color:"#ffdd00"}}>◈ APEX ({p.lc} LC)</button>
            {p.name==="NOVA"&&<button onClick={()=>setShowReport(true)} style={{...S.btnGhost,fontSize:"0.90rem",padding:"0.25rem 0.65rem",borderColor:"#00aaff44",color:"#00aaff"}}>📊 REPORT</button>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"0.95rem",marginBottom:"1rem"}}>
          {CURRICULUM.map(book=>{
            const allSecs=book.chapters.flatMap(c=>c.sections);
            const total=allSecs.length;
            const done=allSecs.filter(s=>p.sectionsDone[s.id]).length;
            const bXP=allSecs.reduce((a,s)=>{
              const pd=p.proofsDone?.[s.id]||[];const cd=p.challengesDone?.[s.id];
              return a+(p.sectionsDone[s.id]?SECTION_XP:0)+pd.filter(Boolean).length*PROOF_PASS_XP+(cd?CHALLENGE_XP:0);
            },0);
            return(
              <button key={book.id} onClick={()=>{setActiveBook(book.id);setActiveChapter(null);}}
                style={{background:"#060d18",border:`1px solid ${done>0?book.color+"44":"#1a2a3a"}`,padding:"1.1rem",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",transition:"border-color 0.2s"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:done>0?3:1,background:done>0?book.color:"#8899aa",transition:"height 0.3s"}}/>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.4rem"}}>
                  <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:book.color,letterSpacing:"0.12em"}}>{book.code}</div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.96rem",fontWeight:700,color:book.color}}>{bXP} XP</div>
                </div>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"0.92rem",fontWeight:700,color:"#d0e0f0",marginBottom:"0.90rem",lineHeight:1.3}}>{book.name}</div>
                <div style={{height:5,background:"#0a1520",borderRadius:2,marginBottom:"0.3rem"}}>
                  <div style={{height:"100%",background:book.color,width:`${(done/total)*100}%`,borderRadius:2,transition:"width 0.5s"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",color:"#aabbcc"}}>{done}/{total} sections</span>
                  <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.8rem",color:book.color}}>{book.chapters.length} chapters →</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── RANK LADDER ── */}
        <div style={{background:"#060d18",border:"1px solid #1a2a3a",padding:"0.85rem 1.25rem"}}>
          <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.90rem",color:"#8899aa",letterSpacing:"0.1em",marginBottom:"0.90rem"}}>RANK LADDER · Ask your parent what each rank earns</div>
          <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
            {RANKS.map(r=>{const achieved=p.xp>=r.min;const isCurrent=getRank(p.xp).name===r.name;return(
              <div key={r.name} style={{flex:1,minWidth:65,padding:"0.4rem 0.5rem",background:isCurrent?`${r.color}11`:"#040b14",border:`1px solid ${achieved?r.color+"55":"#1a2a3a"}`,borderRadius:3,textAlign:"center"}}>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:achieved?r.color:"#aabbcc",fontWeight:isCurrent?700:400}}>{r.name}</div>
                <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",color:achieved?"#556677":"#2a3a4a"}}>{r.min} XP</div>
                {isCurrent&&<div style={{width:"100%",height:2,background:r.color,borderRadius:1,marginTop:2}}/>}
              </div>
            );})}
          </div>
        </div>

      </div>
      <style>{GCSS}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════
function SCard({label,accent,children}){
  return(
    <div style={{background:"#060d18",border:"1px solid #1a2a3a",padding:"1.1rem",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:accent||"#00ffcc",opacity:0.45}}/>
      <div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#aabbcc",letterSpacing:"0.08em",marginBottom:"0.45rem"}}>{label}</div>
      {children}
    </div>
  );
}
function Big({val,color}){return<div style={{fontFamily:"Orbitron,sans-serif",fontSize:"1.8rem",fontWeight:700,color,marginBottom:"0.4rem",lineHeight:1}}>{val}</div>;}
function Bar({pct,color}){return<div style={{height:3,background:"#1a2a3a",marginBottom:"0.35rem"}}><div style={{height:"100%",background:color,width:`${Math.min(100,pct*100)}%`,transition:"width 0.5s"}}/></div>;}
function Sub({text}){return<div style={{fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",color:"#99aabb"}}>{text}</div>;}

// ═══════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════
const S={
  btnCyber:{background:"#001a10",border:"1px solid #00ffcc",color:"#00ffcc",padding:"0.55rem 1.1rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",letterSpacing:"0.08em"},
  btnBack:{background:"none",border:"1px solid #2a3a4a",color:"#00ffcc",padding:"0.28rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",letterSpacing:"0.08em"},
  btnGhost:{background:"none",border:"1px solid #2a3a4a",color:"#8899aa",padding:"0.38rem 0.75rem",cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.96rem",letterSpacing:"0.05em"},
  ansInput:{flex:1,background:"#0a1520",border:"1px solid #2a3a4a",color:"#c8d8e8",padding:"0.55rem 0.85rem",fontFamily:"Rajdhani,sans-serif",fontSize:"1rem",outline:"none",width:"100%"},
  xBtn:{background:"none",border:"1px solid #2a3a4a",color:"#8899aa",width:26,height:26,cursor:"pointer",fontFamily:"Share Tech Mono,monospace",fontSize:"0.92rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
};

const GCSS=`
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&family=Orbitron:wght@400;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body,#root{min-height:100vh;background:#03080f;}
button{cursor:pointer;font-family:Rajdhani,sans-serif;}
input{font-family:Rajdhani,sans-serif;}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#060d18}
::-webkit-scrollbar-thumb{background:#1a2a3a}
`;

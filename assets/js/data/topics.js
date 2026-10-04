/* ============================================================
   topics.js — the five topics, in the order they should be practised.
   `short` is used in compact UI, `name` in headings.
   ============================================================ */
window.DSA = window.DSA || {};
(function (D) {
  "use strict";

  D.topics = [
    {
      id: "numbers",
      tile: "01",
      name: "Number Programs & Number Logic",
      short: "Numbers",
      line: "Digit logic: divisibility, digit sums, primes, bases, series.",
      blurb: "Digit-by-digit reasoning with arithmetic: divisibility, digit sums, reversals, primes, number systems and series. Everything here is built from one loop plus one or two arithmetic operations.",
      focus: ["Digit extraction", "Divisibility rules", "Prime & divisor checks", "Base conversion", "Series & ranges"],
      why: "This is the on-ramp. Almost every assessment opens with one small arithmetic problem because it tests loop control, boundary care and clean output formatting in a few lines. It also builds the muscle you reuse later: taking a number apart, testing a condition cheaply, and stopping at the right moment.",
      howAsked: [
        "Print a single value (sum, count, next number, converted value) for one input.",
        "Print several lines for range and series questions.",
        "Decision-style tasks (prime / palindrome / armstrong / leap year) that expect one word or number as output.",
        "Logic written on paper in the interview round, with the evaluator probing your edge cases."
      ],
      orderNote: "Practise until you can write the algorithms from memory. The loop skeleton (initialise, process, update, stop) repeats in every question here.",
      starterIds: ["num-even-odd", "num-sum-digits", "num-reverse", "num-prime-check"],
      coreConcepts: [
        "Digit extraction loop: `rem = n % 10`, `n = Math.floor(n / 10)` runs in O(log10 n) iterations.",
        "Divisibility & Primes: check trial divisors up to `floor(sqrt(n))` rather than `n` for O(sqrt n) efficiency.",
        "Number systems & Bases: convert between decimal and binary/octal/hex by repeated division and remainder accumulation.",
        "Accumulation & Overflows: guard against 32-bit signed overflow when reversing digits (`res > (INT_MAX - rem) / 10`).",
        "Series & Sequences: identify closed-form arithmetic/geometric formulas or recurrences (e.g. Fibonacci memoization or rolling variables)."
      ],
      examPatterns: [
        { name: "Digit Strip & Rebuild", detail: "Palindrome, Armstrong, Harshad, Automorphic numbers — reconstruct values digit-by-digit." },
        { name: "Prime Sieve & Factorisation", detail: "Sieve of Eratosthenes up to N, prime factor decomposition, and GCD via Euclidean algorithm." },
        { name: "Mathematical Series & Power", detail: "Fibonacci, factorials with trailing zeros count, fast binary exponentiation `O(log n)`." }
      ]
    },
    {
      id: "patterns",
      tile: "02",
      name: "Pattern Programming",
      short: "Patterns",
      line: "Nested-loop shapes: triangles, pyramids, diamonds, hollow outlines.",
      blurb: "Nested-loop printing: stars, numbers, alphabets and mixed shapes. The point is not the drawing — it is proving you can translate a shape into row counts, column counts and space counts.",
      focus: ["Nested loops", "Row/column/space maths", "Symmetry & mirroring", "Hollow shapes", "Number & alphabet fills"],
      why: "Pattern printing is the cheapest way to test whether your loops are under control, and it is among the most repeated sections in written technical rounds because it cannot be solved by recalling a library call. Once you can derive a shape as a formula in row and column, you can derive any of them.",
      howAsked: [
        "Exact shape given as a picture; reproduce it for a given size N.",
        "Same shape upside down, mirrored or hollowed — the interviewer changes one rule at a time.",
        "Number or alphabet version of a star shape; the loop structure is identical and only the printed token changes.",
        "Written on paper in interviews to check whether you derive the loop bounds or recall them."
      ],
      orderNote: "Do these immediately after number logic. Same loop skeleton, but now two counters must agree with each other — exactly the rehearsal you need before arrays.",
      starterIds: ["pat-square-star", "pat-right-triangle", "pat-pyramid", "pat-floyds-triangle"],
      coreConcepts: [
        "Row outer loop: index `r` governs the vertical line and determines the constraints for spaces and symbols.",
        "Space math: leading space formulas (e.g. `n - r` spaces for centered pyramids) create crisp symmetrical alignment.",
        "Column inner loop: character count `c` formula (e.g. `2*r - 1` stars) controls expansion and hollow boundaries.",
        "Hollow boundary condition: print symbol if `r == 1 || r == n || c == 1 || c == maxCols`, else print space.",
        "Character/Number progression: use running trackers (Floyd's triangle) or algebraic offsets (`'A' + c - 1`) for alphanumeric shapes."
      ],
      examPatterns: [
        { name: "Triangles & Pyramids", detail: "Right-angled, inverted, centered pyramids, and alternating binary triangles (`(r + c) % 2`)." },
        { name: "Diamonds & Butterflies", detail: "Upper and lower mirrored halves with dynamically calculated symmetric inner gaps." },
        { name: "Hollow & Concentric Shapes", detail: "Boundary logic for hollow squares/pyramids and distance formulas `min(r, c, n-r+1, n-c+1)`." }
      ]
    },
    {
      id: "arrays",
      tile: "03",
      name: "Arrays & Matrix Traversal",
      short: "Arrays",
      line: "Traversals, two-pointer, sliding windows, hashing, matrices.",
      blurb: "Index arithmetic, running totals, pair and window movements, in-place rearrangement, and the matrix questions that are asked far more often than they deserve.",
      focus: ["Traversal & running totals", "Two-pointer", "Sliding window", "Hashing for lookups", "Matrix index maths"],
      why: "Arrays carry the highest weight of any topic in placement assessments. Off-by-one errors and forgotten duplicates are what separate a passing solution from a failed one, so most of your practice time belongs here.",
      howAsked: [
        "One array in, one number or one rearranged array out — usually with a twist hidden in the wording.",
        "Two or three arrays in (merge, intersection, union, common elements).",
        "Matrix tasks where the answer is a traversal order, a sum along a line, or a rotation.",
        "Interview follow-up: improve the time complexity from quadratic to linear and justify why it is correct."
      ],
      orderNote: "Work in this order: traversal, running totals, two-pointer, hashing, windows, then rearrangement and matrices. Each block reuses the one before it.",
      starterIds: ["arr-largest", "arr-second-largest", "arr-reverse", "arr-two-sum"],
      coreConcepts: [
        "In-place modifications: swap pointers or write indices to avoid allocating O(n) auxiliary memory.",
        "Two-Pointer Technique: inward converging pointers for sorted pairs/reversals; fast-slow pointers for cycles and partition.",
        "Sliding Window: maintain dynamic subarrays with left and right bounds to turn O(n^2) brute force into O(n) running time.",
        "Prefix Sums & Frequency Hashing: precompute running totals for O(1) range queries and O(n) target lookup / duplicate detection.",
        "Matrix Index Arithmetic: 2D-to-1D conversion `index = r * cols + c`, boundary layer peeling, and in-place transpose `matrix[i][j] <-> matrix[j][i]`."
      ],
      examPatterns: [
        { name: "Single-Pass Traversal & Extremes", detail: "Largest, second largest, majority element (Boyer-Moore voting), and Kadane's maximum subarray." },
        { name: "In-Place Array Compaction & Rearrangement", detail: "Move zeros to end, Dutch National Flag (3-way partition), rotate array by k positions." },
        { name: "2D Matrix Spirals & Rotations", detail: "Layered spiral traversal, matrix 90-degree clockwise rotation, search in row-column sorted matrix." },
        { name: "Sliding Window & Pointers", detail: "Trapping rain water, two sum in sorted array, minimum size subarray sum." }
      ]
    },
    {
      id: "strings",
      tile: "04",
      name: "Strings & Character Handling",
      short: "Strings",
      line: "Counting, classification, anagrams, reversal, parsing.",
      blurb: "Character-by-character processing: counting, classifying, comparing, reversing, substituting, and the frequency-map family of problems that defines this topic.",
      focus: ["Frequency maps", "Character classification", "Reversal & pointers", "Anagrams & rotation", "Tokenising sentences"],
      why: "Strings ask the same questions as arrays but in a wider language: case, spaces, punctuation and multi-word input all create edge cases. The same problem can be answered with a frequency map, a sort or two pointers, so this topic trains you to compare approaches instead of stopping at the first working idea.",
      howAsked: [
        "Case classification and counting tasks on a single input line.",
        "Sentence handling: word order, word count, per-word capitalisation, longest or smallest word.",
        "Frequency questions where the required character may not exist — the classic negative case.",
        "Anagram, rotation and substring questions that return with one small extra condition."
      ],
      orderNote: "Start with classification and counting, then reversal and pointers, then frequency maps, and only after that attempt substring and sliding-window problems.",
      starterIds: ["str-reverse", "str-palindrome", "str-count-vowels", "str-anagram"],
      coreConcepts: [
        "ASCII & Alphabet Bucketing: use a 26 or 256 size integer array (`count[ch - 'a']++`) as an O(1) hash map.",
        "Immutability & Reassembly: build string outputs using character arrays or string builders to avoid O(n^2) garbage generation.",
        "Two-Pointer Squeeze: test palindromes or reverse tokens by stepping pointers inward while filtering out punctuation/whitespace.",
        "Sliding Window on Characters: maintain frequencies within a window for longest substring without repeating characters.",
        "Tokenisation & Word Boundaries: iterate through whitespaces to reverse sentence words or capitalize initials without regex dependencies."
      ],
      examPatterns: [
        { name: "Character Counts & Anagrams", detail: "Frequency comparison arrays, first non-repeating character, pangram and anagram verification." },
        { name: "Palindrome & Substring Expansion", detail: "Expand-around-center for longest palindromic substring, alphanumeric palindrome with case insensitivity." },
        { name: "Sentence Formatting & Parsing", detail: "Reverse words in a sentence, string compression (Run Length Encoding), string-to-integer (atoi)." },
        { name: "Parentheses & Balanced Tokens", detail: "Valid parentheses validation, minimum brackets to add/remove, matching tag pairs." }
      ]
    },
    {
      id: "sortsearch",
      tile: "05",
      name: "Sorting & Searching",
      short: "Sorting & Searching",
      line: "Classic sorts to trace, plus binary search on the answer space.",
      blurb: "The comparison sorts you must be able to trace by hand, the counting sorts for small ranges, and searching on sorted data — including binary search pushed onto the answer space.",
      focus: ["Bubble/selection/insertion", "Merge & quick sort", "Counting & radix sort", "Linear & binary search", "Search on ranges"],
      why: "Every assessment assumes sorting and searching as background knowledge, and interviews use them to probe complexity reasoning: why one sort is stable, why binary search needs sorted data, when a counting sort beats everything else. They are also the standard partners for two-pointer array questions.",
      howAsked: [
        "Describe or trace a sort for a given input, or write the algorithm on paper without code.",
        "Sort as a pre-processing step inside a larger question, then scan once.",
        "Search a sorted structure, including rotated and two-dimensional variants.",
        "Complexity and stability comparisons asked verbally in the technical round."
      ],
      orderNote: "Do this last. It closes the loop: you already used sorting and searching informally while doing arrays and strings, and now you formalise the mechanics and the cost of each choice.",
      starterIds: ["ss-bubble-sort", "ss-binary-search", "ss-first-last-occurrence", "ss-rotated-search"],
      coreConcepts: [
        "Binary Search Invariants: condition `low <= high` with midpoint `mid = low + Math.floor((high - low) / 2)` prevents integer overflow.",
        "Search on Rotated Arrays: at least one half (`[low..mid]` or `[mid..high]`) is guaranteed sorted; determine which and check target inclusion.",
        "Search Space Monotonicity: binary search is not just for arrays; apply it to answer domains with predicate functions (e.g., peak element, square root).",
        "Sorting Stability & Guarantees: know why Merge Sort is stable while Quick Sort is not, and when Counting Sort achieves O(n) linear sorting.",
        "Boundary Detection: modified binary search for first occurrence (`high = mid - 1`), last occurrence (`low = mid + 1`), and search insert position."
      ],
      examPatterns: [
        { name: "Binary Search Variations", detail: "First/last occurrence, search insert position, square root via binary search, peak element in O(log n)." },
        { name: "Rotated & Modified Array Search", detail: "Search in rotated sorted array, find minimum in rotated sorted array." },
        { name: "Classic Sorting Algorithms", detail: "Bubble, selection, insertion trace by hand; divide-and-conquer merge sort and quick sort partition." },
        { name: "Non-Comparison Linear Sorts", detail: "Counting sort for bounded ranges and Dutch National Flag three-way partition." }
      ]
    }
  ];
})(window.DSA);

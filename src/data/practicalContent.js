// src/data/PracticalContent.js

export const PRACTICAL_CONTENT = {
  // ==========================================
  // COURSE 1: INFORMATION & COMMUNICATION TECH
  // ==========================================
  'ict-101': {
    topicId: 'ict-101',
    title: 'Introduction to Information & Communication Technology',
    subtitle: 'System Components & Hardware Diagnostics',
    overview: 'Explore fundamental system hardware architecture, inspect system property diagnostics, and distinguish core components from peripherals.',
    steps: [
      {
        id: 'step-1',
        title: 'System Power & UEFI Boot Trail',
        instruction: 'Identify which firmware component runs first when power is delivered to the system board.',
        codeSnippet: `// System Power Sequence
[1] Main Power Supply ON
[2] Subsystem POST Verification
[3] Non-Volatile Memory Initialization
[4] OS Bootloader Launch`,
        options: [
          'UEFI / BIOS Firmware',
          'Operating System Kernel',
          'Display Adapter Drivers',
          'Application Service Manager'
        ],
        correctAnswer: 0,
        hint: 'It is stored on a non-volatile ROM chip on the motherboard.',
        explanation: 'UEFI/BIOS is embedded firmware that executes immediately upon power delivery to initialize hardware before loading the operating system.'
      },
      {
        id: 'step-2',
        title: 'Bus Signal Route Mapping',
        instruction: 'Classify an external optical mouse sending vector inputs to the CPU.',
        codeSnippet: `Input Device -> Controller IC -> Interrupt Request (IRQ) -> CPU Queue`,
        options: ['Storage Peripheral', 'Input Peripheral', 'Output Peripheral', 'System Controller'],
        correctAnswer: 1,
        hint: 'It converts physical hand movement into digital signal streams.',
        explanation: 'Mice, keyboards, and digitizers are classified as Input Devices because they feed user interaction data into the processing core.'
      }
    ]
  },

  'ict-102': {
    topicId: 'ict-102',
    title: 'Computer Systems & Hardware Architecture',
    subtitle: 'CPU, Memory & Motherboard Assembly',
    overview: 'Master step-by-step physical PC assembly procedures, socket pin alignment, RAM latch locking, and thermal management.',
    steps: [
      {
        id: 'step-1',
        title: 'LGA Processor Socket Alignment',
        instruction: 'Determine the correct physical alignment indicator before lowering the CPU retention lever.',
        codeSnippet: `[Socket LGA1700]
Alignment Marker: Gold Triangle Pin 1 -> Socket Corner Indicator
Pre-latch state: Open Lever | Zero Insertion Force (ZIF)`,
        options: [
          'Align the Gold Triangle on the CPU with the Socket Triangle',
          'Force the chip down using equal corner pressure',
          'Apply thermal compound directly to socket pins',
          'Rotate chip 90 degrees counter-clockwise'
        ],
        correctAnswer: 0,
        hint: 'Look for matching orientation triangles on both processor PCB and motherboard socket.',
        explanation: 'Aligning gold pin-1 triangle markers prevents bending microscopic LGA pins during socket latch closure.'
      },
      {
        id: 'step-2',
        title: 'Dual-Channel Memory Channel Configuration',
        instruction: 'To enable dual-channel memory mode on a standard 4-slot motherboard using 2 RAM sticks, which slots should be populated?',
        codeSnippet: `Motherboard Topology: [DIMM_A1] [DIMM_A2] [DIMM_B1] [DIMM_B2]`,
        options: ['Slots A1 and A2', 'Slots A2 and B2', 'Slots A1 and B1 only', 'Slots B1 and B2'],
        correctAnswer: 1,
        hint: 'Dual-channel requires one stick per independent memory channel (Channel A and Channel B).',
        explanation: 'Populating DIMM_A2 and DIMM_B2 puts modules into separate memory channels, doubling available memory throughput.'
      }
    ]
  },

  'ict-103': {
    topicId: 'ict-103',
    title: 'Input & Output Devices Engineering',
    subtitle: 'Port Diagnostics & Bus Bandwidth Configuration',
    overview: 'Analyze hardware connectivity protocols, physical port interface bandwidths, and signal conversion pipelines.',
    steps: [
      {
        id: 'step-1',
        title: 'High-Speed Display Interface Protocol',
        instruction: 'Which port interface supports daisy-chaining multiple 4K displays over a single hardware cable?',
        codeSnippet: `[Port Spec] -> 40 Gbps Bandwidth | DisplayPort Alt-Mode | PCIe Tunneling`,
        options: ['HDMI 2.0', 'Thunderbolt 4 / USB4', 'VGA (DB-15)', 'DVI-Dual Link'],
        correctAnswer: 1,
        hint: 'This port utilizes high-speed Type-C connectors and carries PCIe/DisplayPort signals.',
        explanation: 'Thunderbolt 4 and USB4 provide 40 Gbps bandwidth and support video signal daisy-chaining along with high-speed data transmission.'
      }
    ]
  },

  'ict-104': {
    topicId: 'ict-104',
    title: 'Storage Media & Memory Management',
    subtitle: 'Memory Hierarchy & Transfer Latency Profiling',
    overview: 'Conduct empirical latency checks across CPU Registers, SRAM Cache, DRAM System Memory, and NVMe Flash Storage.',
    steps: [
      {
        id: 'step-1',
        title: 'Memory Hierarchy Latency Evaluation',
        instruction: 'Identify the fastest memory tier with the lowest access latency in the computer system.',
        codeSnippet: `Memory Tiers:
L1/L2 Cache (~1ns) | System DRAM (~50ns) | NVMe SSD (~50us) | HDD (~10ms)`,
        options: ['CPU Registers & L1 Cache', 'DDR5 System Memory', 'NVMe PCIe Gen4 SSD', 'SATA Magnetic Hard Drive'],
        correctAnswer: 0,
        hint: 'It operates on the same semiconductor die as the CPU cores.',
        explanation: 'CPU registers and L1 Cache are built directly onto the silicon die, offering sub-nanosecond access speeds.'
      }
    ]
  },

  'ict-105': {
    topicId: 'ict-105',
    title: 'System Software & Operating Systems',
    subtitle: 'POSIX CLI Terminal Operations & Process Management',
    overview: 'Practice essential POSIX command-line interface tools for directory navigation, permissions, and process lifecycle termination.',
    steps: [
      {
        id: 'step-1',
        title: 'Directory Tree Navigation & Inspection',
        instruction: 'Which POSIX command displays all directory contents, including hidden dotfiles, with full permissions metadata?',
        codeSnippet: `$ _____ -la /var/log/syslog
drwxr-xr-x 2 root root 4096 Sep 8 04:00 .`,
        options: ['ls -la', 'dir /all', 'cat -show', 'tree --hidden'],
        correctAnswer: 0,
        hint: 'Uses list flag (-l) combined with all flag (-a).',
        explanation: '`ls -la` lists files in long format, showing hidden files (starting with `.`), permissions, file sizes, and modification timestamps.'
      },
      {
        id: 'step-2',
        title: 'Process Termination & Signal Dispatch',
        instruction: 'Which command forcibly terminates an unresponsive process with Process ID (PID) 2048?',
        codeSnippet: `Process Table: PID 2048 | Status: Unresponsive | App: orphan_process`,
        options: ['kill -9 2048', 'stop -force 2048', 'end task 2048', 'close 2048'],
        correctAnswer: 0,
        hint: 'Signal 9 sends the non-catchable SIGKILL signal.',
        explanation: '`kill -9 2048` sends a SIGKILL signal to the OS kernel, terminating process 2048 instantly.'
      }
    ]
  },

  'ict-106': {
    topicId: 'ict-106',
    title: 'Application Software & Productivity Tools',
    subtitle: 'Spreadsheet Logic, VLOOKUP & Conditional Aggregations',
    overview: 'Master dynamic spreadsheet formulas, lookup functions, conditional data filtering, and syntax verification for business intelligence ledgers.',
    steps: [
      {
        id: 'step-1',
        title: 'VLOOKUP Parameter Mapping',
        instruction: 'Identify the correct parameter placement for exact matching in a vertical data lookup matrix.',
        codeSnippet: `=VLOOKUP(lookup_value, table_array, col_index_num, range_lookup)`,
        options: [
          '=VLOOKUP("E-101", A2:D50, 3, FALSE)',
          '=VLOOKUP(A2:D50, "E-101", 3, TRUE)',
          '=VLOOKUP(3, "E-101", A2:D50, FALSE)',
          '=VLOOKUP("E-101", 3, A2:D50, 0)'
        ],
        correctAnswer: 0,
        hint: 'Exact matching requires range_lookup to be set to FALSE (or 0) as the 4th argument.',
        explanation: '`=VLOOKUP(search_key, range, index, FALSE)` searches column 1 of range for exact match `search_key` and returns the cell at `index`.'
      },
      {
        id: 'step-2',
        title: 'Conditional Summation (SUMIF)',
        instruction: 'Which formula correctly sums column C (Sales) only where column B (Region) equals "North"?',
        codeSnippet: `Table: A (Date) | B (Region) | C (Sales Amount)`,
        options: [
          '=SUMIF(B2:B100, "North", C2:C100)',
          '=SUMIF(C2:C100, "North", B2:B100)',
          '=SUMIF("North", B2:B100, C2:C100)',
          '=SUM(B2:B100 = "North", C2:C100)'
        ],
        correctAnswer: 0,
        hint: '`SUMIF` syntax order is: range, criteria, [sum_range].',
        explanation: '`=SUMIF(range, criteria, sum_range)` evaluates B2:B100 against "North" and sums matching rows from C2:C100.'
      }
    ]
  },

  'ict-107': {
    topicId: 'ict-107',
    title: 'Data Communication & Computer Networks',
    subtitle: 'IP Routing Diagnostics & Subnet Address Math',
    overview: 'Execute network layer diagnostics, analyze ICMP ping/traceroute hop delays, and calculate CIDR host ranges.',
    steps: [
      {
        id: 'step-1',
        title: 'Subnet Boundary Calculation',
        instruction: 'Calculate the usable host IP range for network mask 192.168.10.0/26.',
        codeSnippet: `CIDR: /26 -> Host Bits: 32 - 26 = 6 bits (2^6 = 64 total addresses)
Network ID: 192.168.10.0
Broadcast ID: 192.168.10.63`,
        options: [
          '192.168.10.1 to 192.168.10.62',
          '192.168.10.0 to 192.168.10.64',
          '192.168.10.1 to 192.168.10.64',
          '192.168.10.2 to 192.168.10.63'
        ],
        correctAnswer: 0,
        hint: 'Usable range starts after Network ID (.0) and ends right before Broadcast ID (.63).',
        explanation: 'In a /26 network (64 total IPs), .0 is Network ID and .63 is Broadcast ID, leaving .1 through .62 for host assignment.'
      },
      {
        id: 'step-2',
        title: 'Traceroute Latency Hop Analysis',
        instruction: 'What condition does a traceroute asterisk (`* * *`) line signify during path profiling?',
        codeSnippet: `$ traceroute 8.8.8.8
1  192.168.1.1   1.2 ms
2  10.200.0.1    12.4 ms
3  * * * Request timed out.`,
        options: [
          'Router interface dropped ICMP or hit a firewall timeout',
          'Destination IP address reached successfully',
          'Bandwidth limit doubled automatically',
          'Local network adapter unlinked'
        ],
        correctAnswer: 0,
        hint: 'Asterisks denote unreturned ICMP Time Exceeded packets from a transit router.',
        explanation: '`* * *` indicates the router at that hop discarded ICMP probes or was blocked by a security ACL/firewall rule.'
      }
    ]
  },

  'ict-108': {
    topicId: 'ict-108',
    title: 'Internet, WWW, & Web Browsing Security',
    subtitle: 'SSL/TLS Certificate Inspection & URL Header Defense',
    overview: 'Analyze HTTPS handshake elements, inspect X.509 certificate chains, and detect homograph domain attacks.',
    steps: [
      {
        id: 'step-1',
        title: 'Homograph Domain Spoofing Detection',
        instruction: 'Identify the malicious Punycode domain technique used in phishing URL structures.',
        codeSnippet: `Legitimate: https://paypal.com
Spoofed:    https://xn--pypal-4ve.com (renders as paypaI.com)`,
        options: [
          'IDN Homograph Attack using Cyrillic/lookalike characters',
          'SQL Injection via URL path query parameters',
          'Cross-Site Scripting (XSS) payload injection',
          'DNS Amplification Reflector'
        ],
        correctAnswer: 0,
        hint: 'Look for non-ASCII Unicode characters translated into Punycode (`xn--`).',
        explanation: 'Internationalized Domain Name (IDN) homograph attacks substitute ASCII characters with identical-looking Cyrillic/Greek characters.'
      }
    ]
  },

  'ict-109': {
    topicId: 'ict-109',
    title: 'Information Security & Cyber Hygiene',
    subtitle: 'Entropy Modeling & Packet Filter Configuration',
    overview: 'Compute mathematical password entropy values and write Linux host firewall rules (`ufw` / `iptables`) to block brute-force attacks.',
    steps: [
      {
        id: 'step-1',
        title: 'Password Entropy Mathematics',
        instruction: 'Calculate key space size for an 8-character password using only lower-case English letters (26 possibilities).',
        codeSnippet: `Entropy Formula: E = L * log2(R)
R = Pool Size (26), L = Length (8)`,
        options: [
          '26^8 ≈ 208 Billion combinations',
          '26 * 8 = 208 combinations',
          '2^26 = 67 Million combinations',
          '8^26 combinations'
        ],
        correctAnswer: 0,
        hint: 'Total combinations equals Pool Size raised to the power of Length (R^L).',
        explanation: '26^8 = 208,827,064,576 total potential keys, producing roughly 37.6 bits of cryptographic entropy.'
      },
      {
        id: 'step-2',
        title: 'Host Firewall Rule Dispatch',
        instruction: 'Which command denies incoming SSH connections on Port 22 using Ubuntu Uncomplicated Firewall (`ufw`)?',
        codeSnippet: `$ sudo _____ deny 22/tcp`,
        options: ['ufw', 'iptables -A', 'netsh', 'chmod'],
        correctAnswer: 0,
        hint: 'Use the standard CLI frontend utility for managing iptables on Ubuntu.',
        explanation: '`sudo ufw deny 22/tcp` blocks incoming TCP traffic destined for Port 22.'
      }
    ]
  },

  'ict-110': {
    topicId: 'ict-110',
    title: 'Data Processing & File System Management',
    subtitle: 'UNIX File Permissions & Access Control Matrices',
    overview: 'Configure octal permission masks (`chmod`), manage file ownership (`chown`), and evaluate directory tree traversal structures.',
    steps: [
      {
        id: 'step-1',
        title: 'Octal Permission Mask Evaluation',
        instruction: 'Translate UNIX file mode `-rwxr-xr--` into its corresponding 3-digit octal representation.',
        codeSnippet: `Bit Weights: Read (r) = 4 | Write (w) = 2 | Execute (x) = 1
User: rwx | Group: r-x | Others: r--`,
        options: ['754', '644', '777', '755'],
        correctAnswer: 0,
        hint: 'User (4+2+1=7), Group (4+0+1=5), Others (4+0+0=4).',
        explanation: 'rwx = 7, r-x = 5, r-- = 4. The complete octal permission representation is 754.'
      }
    ]
  },

  'ict-111': {
    topicId: 'ict-111',
    title: 'Multimedia Systems & Digital Content Creation',
    subtitle: 'Color Spaces & Compression Artifact Analysis',
    overview: 'Manipulate additive (RGB) and subtractive (CMYK) color gamuts, evaluate sampling rates, and execute lossy vs. lossless media compression benchmarks.',
    steps: [
      {
        id: 'step-1',
        title: 'Additive vs. Subtractive Color Spaces',
        instruction: 'Which color model is natively utilized by digital screens emitting direct light versus offset printing presses?',
        codeSnippet: `Digital Display: Additive Model (Combines light to reach White)
Offset Print:    Subtractive Model (Combines ink to reach Black)`,
        options: [
          'Displays use RGB (Red, Green, Blue); Print uses CMYK (Cyan, Magenta, Yellow, Key/Black)',
          'Displays use CMYK; Print uses RGB',
          'Both displays and offset printing use HSV color space',
          'Displays use Monochrome; Print uses YCbCr'
        ],
        correctAnswer: 0,
        hint: 'RGB creates white light at max intensity; CMYK uses physical ink pigments.',
        explanation: 'RGB is an additive color space for light-emitting displays. CMYK is a subtractive color model for physical ink printing.'
      },
      {
        id: 'step-2',
        title: 'Lossy vs. Lossless Compression Pipelines',
        instruction: 'Which media format uses lossless compression to preserve 100% of original bitmap pixel data without compression artifacts?',
        codeSnippet: `Raw Bitmap Data -> Compression Algorithm -> Stream Output
Format A: Discrete Cosine Transform (Quantization drops high frequency details)
Format B: DEFLATE Lempel-Ziv-Welch (Exact bitwise preservation)`,
        options: ['PNG (Portable Network Graphics)', 'JPEG (Joint Photographic Experts Group)', 'MP3 Audio', 'MPEG-4 Video'],
        correctAnswer: 0,
        hint: 'PNG uses DEFLATE (lossless) while JPEG discards high-frequency visual data (lossy).',
        explanation: 'PNG uses lossless compression, ensuring identical pixel reconstruction upon decoding. JPEG and MP3 drop perceptually redundant data.'
      }
    ]
  },

  'ict-112': {
    topicId: 'ict-112',
    title: 'Database Management Systems (DBMS) Fundamentals',
    subtitle: 'Relational Joins, Aggregations & Query Optimization',
    overview: 'Construct ANSI SQL relational queries, join tables using primary and foreign keys, and perform grouped dataset filtering.',
    steps: [
      {
        id: 'step-1',
        title: 'Relational Table Joins (INNER JOIN)',
        instruction: 'Write the correct ANSI SQL syntax to join `users` and `orders` on matching user ID keys.',
        codeSnippet: `SELECT users.name, orders.amount 
FROM users 
_____ orders ON users.id = orders.user_id;`,
        options: [
          'INNER JOIN',
          'CROSS LINK',
          'UNION ALL',
          'GROUP BY'
        ],
        correctAnswer: 0,
        hint: 'Combines rows from two tables where the joining condition is met.',
        explanation: '`INNER JOIN` returns only records that have matching values in both linked tables.'
      },
      {
        id: 'step-2',
        title: 'Aggregated Group Filtering (HAVING Clause)',
        instruction: 'Which SQL clause filters aggregated calculation results (such as `COUNT()` or `SUM()`) after grouping?',
        codeSnippet: `SELECT department_id, COUNT(*) 
FROM employees 
GROUP BY department_id 
_____ COUNT(*) > 5;`,
        options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
        correctAnswer: 0,
        hint: '`WHERE` filters individual rows before grouping; this keyword filters aggregated groups.',
        explanation: 'The `HAVING` clause filters aggregated datasets produced by `GROUP BY`. `WHERE` cannot be used directly on aggregate functions.'
      }
    ]
  },

  'ict-113': {
    topicId: 'ict-113',
    title: 'Systems Development & Problem-Solving Logic',
    subtitle: 'SDLC Methodologies & Standardized Flowchart Mapping',
    overview: 'Analyze Software Development Life Cycle (SDLC) phases and map program control flow using standard ISO flowchart symbols.',
    steps: [
      {
        id: 'step-1',
        title: 'Standardized Flowchart Symbol Mapping',
        instruction: 'Which geometric shape represents a conditional decision point (e.g. IF/ELSE) in standard ISO flowcharting?',
        codeSnippet: `Symbol A: Rectangle [ Processing Action ]
Symbol B: Diamond    < Conditional Choice? >
Symbol C: Parallelogram [/ Input / Output /]`,
        options: ['Diamond', 'Rectangle', 'Parallelogram', 'Oval / Capsule'],
        correctAnswer: 0,
        hint: 'Diamonds branch into TRUE (Yes) or FALSE (No) output paths.',
        explanation: 'In standard flowcharting, a Diamond represents decision logic, Rectangles represent processes, and Parallelograms represent I/O operations.'
      },
      {
        id: 'step-2',
        title: 'SDLC Sequence Engineering',
        instruction: 'Identify the correct chronological order of classical Software Development Life Cycle (SDLC) phases.',
        codeSnippet: `Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5`,
        options: [
          'Requirements Analysis -> System Design -> Implementation (Coding) -> Testing -> Deployment & Maintenance',
          'Testing -> Requirements Analysis -> System Design -> Deployment -> Coding',
          'System Design -> Coding -> Requirements Analysis -> Maintenance -> Testing',
          'Deployment -> Testing -> System Design -> Requirements Analysis -> Coding'
        ],
        correctAnswer: 0,
        hint: 'System requirements must be defined and designed prior to writing code or testing.',
        explanation: 'Standard SDLC follows: Requirements gathering -> Architectural Design -> Implementation -> Quality Assurance Testing -> Production Deployment.'
      }
    ]
  },

  'ict-114': {
    topicId: 'ict-114',
    title: 'Ethical, Legal, & Environmental Impacts of ICT',
    subtitle: 'Software Licensing Models & E-Waste Lifecycle Audits',
    overview: 'Audit open-source vs. commercial software licensing models and calculate hazardous heavy metal risks in electronic waste disposal.',
    steps: [
      {
        id: 'step-1',
        title: 'Software License Model Analysis',
        instruction: 'Which open-source license mandates that any derivative works or modified source code must also be released under the same open copyleft license terms?',
        codeSnippet: `License A: Copyleft / Reciprocal (Forces downstream code to stay open)
License B: Permissive (Allows proprietary commercial closed-source reuse)`,
        options: [
          'GNU General Public License (GPL)',
          'MIT License',
          'Apache 2.0 License',
          'Proprietary EULA'
        ],
        correctAnswer: 0,
        hint: 'The GPL contains a "strong copyleft" clause enforcing open distribution.',
        explanation: 'The GNU General Public License (GPL) is a strong copyleft license requiring derivative source code modifications to remain open under GPL.'
      },
      {
        id: 'step-2',
        title: 'E-Waste Heavy Metal Environmental Impact',
        instruction: 'Which toxic heavy metal commonly found in legacy CRT monitors and solder poses severe bioaccumulation risks in soil and groundwater if landfilled incorrectly?',
        codeSnippet: `Hazard Assessment: CRT Glass Lead Oxide (PbO) & Cadmium Solder Compounds`,
        options: ['Lead (Pb)', 'Aluminum (Al)', 'Silicon (Si)', 'Iron (Fe)'],
        correctAnswer: 0,
        hint: 'This heavy metal was heavily used in CRT glass shielding and circuit board solder.',
        explanation: 'Lead (Pb) is a hazardous neurotoxin found in legacy electronics that leaches into soil ecosystems if not processed in specialized e-waste recycling facilities.'
      }
    ]
  },

  // ==========================================
  // COURSE 2: COMPUTER SCIENCE & ALGORITHMS
  // ==========================================
  'cs-201': {
    topicId: 'cs-201',
    title: 'Algorithmic Thinking & Complexity Baseline',
    subtitle: 'Algorithm Execution Tracing & Big-O Time Complexity',
    overview: 'Analyze step-by-step state changes during loop iterations, trace code execution paths, and determine asymptotic time complexity baselines.',
    steps: [
      {
        id: 'step-1',
        title: 'Asymptotic Time Complexity Analysis',
        instruction: 'Determine the worst-case Big-O time complexity for the nested execution loops shown below.',
        codeSnippet: `function processGrid(matrix) {
  let n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      console.log(matrix[i][j]);
    }
  }
}`,
        options: ['O(n²)', 'O(n)', 'O(log n)', 'O(2ⁿ)'],
        correctAnswer: 0,
        hint: 'The outer loop runs n times and the inner loop executes n times for each outer iteration.',
        explanation: 'Two nested loops iterating up to n result in n × n operations, yielding a quadratic time complexity of O(n²).'
      },
      {
        id: 'step-2',
        title: 'Algorithm Execution State Trace',
        instruction: 'What is the final returned value of `total` after executing this logarithmic sequence loop?',
        codeSnippet: `let total = 0;
let i = 16;
while (i > 1) {
  total += i;
  i = Math.floor(i / 2);
}`,
        options: ['30', '31', '16', '32'],
        correctAnswer: 0,
        hint: 'Trace iteration states: i = 16 (total=16), i = 8 (total=24), i = 4 (total=28), i = 2 (total=30), i = 1 (loop terminates).',
        explanation: 'Iterations: 1st (i=16, total=16), 2nd (i=8, total=24), 3rd (i=4, total=28), 4th (i=2, total=30). When i becomes 1, the condition (1 > 1) evaluates to false.'
      }
    ]
  },

  'cs-202': {
    topicId: 'cs-202',
    title: 'Number Systems & Binary Arithmetic',
    subtitle: "Radix Conversions & Two's Complement Integers",
    overview: "Convert numerical data across Binary, Octal, Decimal, and Hexadecimal representations, and calculate signed 8-bit Two's Complement binary values.",
    steps: [
      {
        id: 'step-1',
        title: 'Hexadecimal to Binary Base Conversion',
        instruction: 'Which 8-bit binary pattern corresponds directly to the hexadecimal value `0x3F`?',
        codeSnippet: `Hex Nibble 1 (3)  -> Binary: 0011
Hex Nibble 2 (F)  -> Binary: 1111`,
        options: ['00111111', '00111110', '01111111', '00011111'],
        correctAnswer: 0,
        hint: 'Convert each hex digit into a 4-bit nibble: 3 = 0011, F = 1111.',
        explanation: 'Hex 0x3F converts nibble-by-nibble: 3 is 0011₂ and F (15) is 1111₂, yielding 00111111₂ (decimal 63).'
      },
      {
        id: 'step-2',
        title: "Signed 8-Bit Two's Complement Calculation",
        instruction: "What is the 8-bit Two's Complement binary representation of the decimal integer -5?",
        codeSnippet: `Step 1: Positive 5 in 8-bit binary  = 00000101
Step 2: Invert all bits (One's Comp) = 11111010
Step 3: Add 1 to LSB                 = 11111011`,
        options: ['11111011', '11111010', '10000101', '11111101'],
        correctAnswer: 0,
        hint: 'Invert bits of +5 (00000101) to get 11111010, then add 1.',
        explanation: "To represent negative numbers in Two's Complement: invert all bits of positive 5 (00000101 -> 11111010) and add 1, giving 11111011₂."
      }
    ]
  },

  'cs-203': {
    topicId: 'cs-203',
    title: 'Digital Logic Gates & Combinational Circuits',
    subtitle: 'Truth Tables, Gate Operations & Universal Logic',
    overview: 'Build evaluation truth tables for fundamental logic gates (AND, OR, NOT, NAND, XOR) and derive combined circuit outputs.',
    steps: [
      {
        id: 'step-1',
        title: 'Exclusive-OR (XOR) Truth Evaluation',
        instruction: 'Select the output state for an XOR gate given inputs A = 1 and B = 1.',
        codeSnippet: `Input A = 1
Input B = 1
Gate    = XOR (Exclusive OR)
Output  = ?`,
        options: ['0 (LOW)', '1 (HIGH)', 'High Impedance', 'Undefined'],
        correctAnswer: 0,
        hint: 'An XOR gate yields 1 ONLY when the inputs are different from each other.',
        explanation: 'The XOR gate outputs 1 only when inputs differ (one 0 and one 1). When both inputs are 1, the XOR output evaluates to 0.'
      },
      {
        id: 'step-2',
        title: 'Universal Gate Equivalence (NAND Logic)',
        instruction: 'How can a single 2-input NAND gate be wired to function as a standard NOT inverter?',
        codeSnippet: `NAND Gate Truth Table:
A=0, B=0 -> Output 1
A=1, B=1 -> Output 0`,
        options: [
          'Tie both inputs A and B together to the single input signal',
          'Connect input A to Ground and leave B floating',
          'Invert the power supply voltage pin',
          'Connect both inputs directly to VCC (+5V)'
        ],
        correctAnswer: 0,
        hint: 'When inputs A and B are tied together, inputting 0 gives NAND(0,0)=1 and inputting 1 gives NAND(1,1)=0.',
        explanation: 'Connecting both NAND inputs together makes them receive identical signals: NAND(0,0)=1 and NAND(1,1)=0, producing a NOT gate output.'
      }
    ]
  },

  'cs-204': {
    topicId: 'cs-204',
    title: 'Boolean Algebra & Logic Simplification',
    subtitle: "De Morgan's Laws & Karnaugh Map (K-Map) Reduction",
    overview: 'Apply algebraic theorems and Karnaugh Maps to minimize Boolean logic functions down to minimal gate counts.',
    steps: [
      {
        id: 'step-1',
        title: "De Morgan's Laws Transformation",
        instruction: "Apply De Morgan's Law to simplify the inverted conjunction expression NOT (A AND B).",
        codeSnippet: `Expression: ¬(A ∧ B)
Equivalence Rule: Invert terms and switch operator`,
        options: ['(NOT A) OR (NOT B)', '(NOT A) AND (NOT B)', 'NOT (A OR B)', 'A AND (NOT B)'],
        correctAnswer: 0,
        hint: "De Morgan's Law states that the complement of a product equals the sum of the individual complements.",
        explanation: "De Morgan's Law rules state that ¬(A · B) = ¬A + ¬B. The inverted AND becomes an OR gate with negated inputs."
      },
      {
        id: 'step-2',
        title: 'Boolean Equation Absorption Law',
        instruction: 'Simplify the algebraic expression: F = A + (A · B)',
        codeSnippet: `F = A + (A · B)
F = A · (1 + B)   [Factoring A]
F = A · (1)       [Since 1 + B = 1]`,
        options: ['A', 'B', 'A + B', 'A · B'],
        correctAnswer: 0,
        hint: 'Apply the Absorption Law: A ORed with (A AND anything) simplifies to A.',
        explanation: 'According to the Boolean Absorption Law, A + AB = A(1 + B) = A(1) = A.'
      }
    ]
  },

  'cs-205': {
    topicId: 'cs-205',
    title: 'Structured Pseudocode & Algorithm Design',
    subtitle: 'Flow Control Structures & Modular Algorithm Mapping',
    overview: 'Translate plain-English logic specifications into unambiguous, structured pseudocode using standard control constructs.',
    steps: [
      {
        id: 'step-1',
        title: 'Loop Control Construct Selection',
        instruction: 'Which pseudocode construct is appropriate when the total number of iterations is known before entering the loop?',
        codeSnippet: `Option A: FOR counter FROM 1 TO limit DO
Option B: WHILE condition IS TRUE DO
Option C: REPEAT ... UNTIL condition`,
        options: ['FOR loop', 'WHILE loop', 'REPEAT-UNTIL loop', 'IF-THEN-ELSE decision'],
        correctAnswer: 0,
        hint: 'Definite iteration uses a counter variable with defined upper and lower bounds.',
        explanation: 'A FOR loop is used for definite iteration where bounds are known in advance. WHILE and REPEAT-UNTIL loops handle indefinite iteration.'
      },
      {
        id: 'step-2',
        title: 'Array Index Search Algorithm Logic',
        instruction: 'Identify the missing conditional clause in this linear search algorithm.',
        codeSnippet: `FUNCTION findElement(array, target)
  FOR i FROM 0 TO length(array) - 1 DO
    IF _____ THEN
      RETURN i
    END IF
  END FOR
  RETURN -1
END FUNCTION`,
        options: ['array[i] == target', 'array[i] != target', 'i == target', 'length(array) == target'],
        correctAnswer: 0,
        hint: 'The algorithm checks whether the current array element matches the search target.',
        explanation: '`array[i] == target` compares the current element at index `i` against the requested `target` value.'
      }
    ]
  },

  'cs-206': {
    topicId: 'cs-206',
    title: 'Variables, Data Types & Scope Boundaries',
    subtitle: 'Memory Footprints & Variable Scope Isolation',
    overview: 'Analyze primitive memory allocation sizes, type system boundaries, and scope lifecycles across block and lexical function contexts.',
    steps: [
      {
        id: 'step-1',
        title: 'Primitive Memory Allocation & Footprint',
        instruction: 'Calculate the total memory requirement in bytes for an array holding 100 64-bit double-precision floating-point numbers.',
        codeSnippet: `Datatype: double (IEEE 754)
Width:    64 bits (8 bytes)
Quantity: 100 elements`,
        options: ['800 Bytes', '400 Bytes', '100 Bytes', '6400 Bytes'],
        correctAnswer: 0,
        hint: 'Multiply the element count by the byte size of a 64-bit float (64 bits / 8 bits = 8 bytes).',
        explanation: 'Each 64-bit floating-point number consumes 8 bytes. For 100 elements: 100 × 8 = 800 bytes of contiguous memory.'
      },
      {
        id: 'step-2',
        title: 'Block Scope vs. Lexical Scope Boundary',
        instruction: 'What value is printed to the console when `console.log(x)` executes outside the `if` block?',
        codeSnippet: `function scopeTest() {
  let x = 10;
  if (true) {
    let x = 20;
  }
  console.log(x);
}
scopeTest();`,
        options: ['10', '20', 'undefined', 'ReferenceError'],
        correctAnswer: 0,
        hint: 'The `let` keyword creates block-scoped variable declarations inside the `if` statement.',
        explanation: 'Variables declared with `let` inside the `if` block are scoped strictly to that block. The outer `x` remains unaffected (10).'
      }
    ]
  },

  'cs-207': {
    topicId: 'cs-207',
    title: 'Control Structures & Conditional Branching',
    subtitle: 'Execution Pathing, Fall-Through & Short-Circuit Evaluation',
    overview: 'Trace nested conditional execution paths, analyze switch-case fall-through behavior, and optimize short-circuit Boolean evaluation.',
    steps: [
      {
        id: 'step-1',
        title: 'Switch-Case Fall-Through Execution Path',
        instruction: 'What is the final value of `count` if `code` equals `2` and `break` statements are omitted?',
        codeSnippet: `let count = 0;
let code = 2;
switch (code) {
  case 1: count += 1;
  case 2: count += 5;
  case 3: count += 10;
  default: count += 2;
}`,
        options: ['17', '5', '15', '18'],
        correctAnswer: 0,
        hint: 'Without `break` statements, execution falls through all subsequent cases starting from matching case 2.',
        explanation: 'Matches case 2 (count += 5 = 5), falls through to case 3 (count += 10 = 15), and falls through to default (count += 2 = 17).'
      },
      {
        id: 'step-2',
        title: 'Short-Circuit Logic Optimization',
        instruction: 'In the expression `A && B()`, under what condition is the function `B()` skipped entirely?',
        codeSnippet: `if (A && B()) {
  // Execute critical payload
}`,
        options: [
          'When A evaluates to false',
          'When A evaluates to true',
          'When B() returns false',
          'When A is null or undefined'
        ],
        correctAnswer: 0,
        hint: 'The logical AND operator (`&&`) short-circuits if the left operand evaluates to falsy.',
        explanation: 'Logical AND requires both operands to be true. If `A` is false, the expression short-circuits immediately without invoking `B()`.'
      }
    ]
  },

  'cs-208': {
    topicId: 'cs-208',
    title: 'Loops, Iteration & Loop Invariants',
    subtitle: 'Iterative Termination Guardrails & Invariant Proofs',
    overview: 'Differentiate pre-test (`while`) vs post-test (`do-while`) iterations, prevent infinite loop conditions, and prove loop invariants.',
    steps: [
      {
        id: 'step-1',
        title: 'Do-While Minimum Execution Guarantee',
        instruction: 'How many times does the body of a `do-while` loop execute if the condition is initially false?',
        codeSnippet: `let count = 10;
do {
  count++;
} while (count < 5);`,
        options: ['Exactly 1 time', '0 times', 'Infinite times', '5 times'],
        correctAnswer: 0,
        hint: 'A `do-while` loop tests its conditional expression at the end of each iteration.',
        explanation: 'Because `do-while` is a post-test loop structure, the code body always executes at least once before testing the condition.'
      },
      {
        id: 'step-2',
        title: 'Infinite Loop Guard Detection',
        instruction: 'Identify the flaw causing an infinite loop in this decrementing counter routine.',
        codeSnippet: `for (let i = 10; i >= 0; i++) {
  console.log(i);
}`,
        options: [
          'The loop counter uses increment (`i++`) instead of decrement (`i--`)',
          'The initialization `let i = 10` is invalid',
          'The condition `i >= 0` should be `i == 0`',
          'The loop variable is block-scoped'
        ],
        correctAnswer: 0,
        hint: 'Check the update expression: incrementing starting at 10 means `i >= 0` will remain true forever.',
        explanation: 'Incrementing `i` starting at 10 causes `i` to grow endlessly (11, 12, 13...), so `i >= 0` always evaluates to true.'
      }
    ]
  },

  'cs-209': {
    topicId: 'cs-209',
    title: 'Arrays & Linear Data Structures',
    subtitle: 'Contiguous Memory Offsets & Element Manipulation',
    overview: 'Calculate physical array memory addresses using zero-index base offsets and evaluate element insertion/deletion time complexities.',
    steps: [
      {
        id: 'step-1',
        title: 'Zero-Index Memory Offset Calculation',
        instruction: 'Given a contiguous array starting at base address `0x1000` with 4-byte integers, calculate the address of element at index `4`.',
        codeSnippet: `Formula: Address(i) = BaseAddress + (i * ElementSize)
Base Address = 0x1000 (4096)
Index = 4 | Element Size = 4 bytes`,
        options: ['0x1010 (4112)', '0x1004 (4100)', '0x1016 (4118)', '0x1008 (4104)'],
        correctAnswer: 0,
        hint: 'Multiply the index 4 by the element size 4 bytes: 4 × 4 = 16 bytes offset.',
        explanation: 'Address = Base + (Index × Size) = 0x1000 + (4 × 4) = 0x1000 + 16 (0x10) = 0x1010.'
      },
      {
        id: 'step-2',
        title: 'Worst-Case Array Insertion Complexity',
        instruction: 'What is the worst-case time complexity of inserting an element at index 0 of a unsorted fixed-size array?',
        codeSnippet: `Array: [ 20, 30, 40, 50, _ ]
Action: Insert 10 at Index 0
Required Shifting: All existing elements must move 1 position right`,
        options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'],
        correctAnswer: 0,
        hint: 'Inserting at the beginning requires shifting every existing element one index to the right.',
        explanation: 'Inserting at index 0 requires shifting all n existing elements to the right to make space, taking O(n) linear time.'
      }
    ]
  },

  'cs-210': {
    topicId: 'cs-210',
    title: 'Functions, Subroutines & Call Stack Frames',
    subtitle: 'Activation Records, Parameter Passing & Scope Resolution',
    overview: 'Trace call stack stack frame pushes and pops during nested subroutine calls and analyze pass-by-value vs pass-by-reference side-effects.',
    steps: [
      {
        id: 'step-1',
        title: 'Call Stack Frame Allocation Order',
        instruction: 'In nested function calls `A() -> B() -> C()`, which call frame is popped off the activation stack first upon execution?',
        codeSnippet: `Call Sequence:
1. main() calls A()
2. A() calls B()
3. B() calls C()`,
        options: ['C()', 'A()', 'main()', 'B()'],
        correctAnswer: 0,
        hint: 'The runtime call stack operates on a Last-In, First-Out (LIFO) protocol.',
        explanation: '`C()` is pushed onto the top of the stack last, so it executes and pops off first (LIFO order) when returning control to `B()`.'
      },
      {
        id: 'step-2',
        title: 'Pass-by-Value vs. Pass-by-Reference Mutation',
        instruction: 'What value does `num` retain after being passed into `increment(x)` assuming pass-by-value semantics?',
        codeSnippet: `function increment(x) {
  x = x + 1;
}
let num = 5;
increment(num);
console.log(num);`,
        options: ['5', '6', 'undefined', 'ReferenceError'],
        correctAnswer: 0,
        hint: 'Pass-by-value copies the primitive variable value into the function parameter parameter space.',
        explanation: 'With pass-by-value, `increment` receives a local copy of `num`. Modifying `x` inside the function does not alter the caller variable `num` (5).'
      }
    ]
  },

  'cs-211': {
    topicId: 'cs-211',
    title: 'Searching & Sorting Algorithms',
    subtitle: 'Algorithmic Efficiency & Search Space Reduction',
    overview: 'Visualize iterative pass execution across Bubble Sort, Selection Sort, Linear Search, and logarithmic Binary Search.',
    steps: [
      {
        id: 'step-1',
        title: 'Binary Search Space Halving & Prerequisites',
        instruction: 'What critical prerequisite must a dataset satisfy before a Binary Search algorithm can be executed on it?',
        codeSnippet: `Linear Search:  Checks elements index 0, 1, 2... N (Unordered OK)
Binary Search:  Calculates mid = floor((low + high) / 2) (Requires constraint)`,
        options: [
          'The dataset must be sorted in contiguous memory',
          'The array size must be an even power of 2',
          'All array elements must be unique positive integers',
          'The array must be stored inside a binary search tree'
        ],
        correctAnswer: 0,
        hint: 'Binary search relies on dividing a ordered search space into lower and upper halves.',
        explanation: 'Binary Search requires the array to be sorted first. Sorted ordering allows the algorithm to discard half of the remaining elements at each step (O(log n)).'
      },
      {
        id: 'step-2',
        title: 'Bubble Sort Invariant & Quadratic Operations',
        instruction: 'After the first complete outer pass of Bubble Sort on an array of length N, which element is guaranteed to be in its correct final sorted position?',
        codeSnippet: `Input: [5, 1, 4, 2, 8]
Pass 1 Comparisons: (5,1) -> (5,4) -> (5,2) -> (5,8)
Result Pass 1: [1, 4, 2, 5, 8]`,
        options: [
          'The largest element is placed at the highest index (N - 1)',
          'The smallest element is placed at index 0',
          'The median element is anchored in the exact middle index',
          'All even-indexed positions are fully sorted'
        ],
        correctAnswer: 0,
        hint: 'Bubble Sort repeatedly swaps adjacent out-of-order elements, "bubbling" extreme values to the end.',
        explanation: 'During each complete pass of Bubble Sort, adjacent elements are compared and swapped. The largest unsorted element "bubbles up" to its correct position at the far right.'
      }
    ]
  },

  'cs-212': {
    topicId: 'cs-212',
    title: 'Software Testing, Boundary Analysis & Debugging',
    subtitle: 'Unit Test Assertions, Edge Cases & Stack Trace Diagnostic',
    overview: 'Design boundary test cases, apply equivalence partitioning, and parse call stack traces to identify runtime exceptions.',
    steps: [
      {
        id: 'step-1',
        title: 'Boundary Value Analysis (Edge Case Testing)',
        instruction: 'Which test input set provides complete coverage for an input validation function accepting age values from 18 to 65 inclusive?',
        codeSnippet: `function validateAge(age) {
  if (age >= 18 && age <= 65) return true;
  return false;
}`,
        options: [
          'Boundary Values: 17, 18, 19, 64, 65, 66',
          'Interior Values: 20, 30, 40, 50',
          'Random Values: 0, 25, 100',
          'Negative Values: -18, -65'
        ],
        correctAnswer: 0,
        hint: 'Boundary Value Analysis targets values immediately at, just below, and just above valid boundary limits.',
        explanation: 'Boundary testing tests upper and lower limits (18, 65) alongside immediate off-boundary values (17, 19 and 64, 66) where logic errors frequently occur.'
      },
      {
        id: 'step-2',
        title: 'Stack Trace Interpretation & Root Cause Analysis',
        instruction: 'Based on this error stack trace snippet, what caused the execution crash and where did it originate?',
        codeSnippet: `TypeError: Cannot read properties of undefined (reading 'length')
    at processItems (app.js:42:18)
    at main (app.js:12:3)`,
        options: [
          'An attempt was made to access `.length` on an uninitialized/undefined object on line 42 of app.js',
          'A syntax error occurred on line 12 of app.js inside `main()`',
          'The `processItems` function was missing a return keyword',
          'An infinite stack overflow occurred inside `app.js`'
        ],
        correctAnswer: 0,
        hint: 'Examine the exception type and the top line of the call stack.',
        explanation: 'The top line of the stack trace shows `TypeError` thrown at `app.js` line 42 because a variable evaluated to `undefined` when attempting to access `.length`.'
      }
    ]
  }
};

export const getPracticalContentByTopic = (topicId) => {
  return PRACTICAL_CONTENT[topicId] || null;
};
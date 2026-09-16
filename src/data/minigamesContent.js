/**
 * ============================================================================
 * 26-TOPIC COMPUTING SUITE DATABASE
 * ============================================================================
 * 
 * GAME TYPE OPERATIONS & ANSWER SCHEMAS:
 * 
 * 1. 'matching': 
 *    - Operation: User clicks a 'key', then clicks a 'target'. 
 *    - Answer Schema: `pairs: [{ id, key, target, hint }]`. The engine validates if the selected key's target matches the clicked target.
 * 
 * 2. 'category': 
 *    - Operation: User clicks a category button on an unclassified item.
 *    - Answer Schema: `categories: ['Cat A', 'Cat B']`, `items: [{ id, text, category, hint }]`. 
 *      The engine checks if `item.category` matches the clicked category button.
 * 
 * 3. 'sequence': 
 *    - Operation: User uses Up/Down arrows to reorder items, then clicks "Verify".
 *    - Answer Schema: `steps: [{ id, text, hint }]`. The engine verifies the array order matches the original `steps` array order by `id`.
 * 
 * 4. 'scenario': 
 *    - Operation: Multiple-choice question. User clicks an option.
 *    - Answer Schema: `scenarios: [{ id, prompt, hint, options: [...], correct: <index_of_correct_option> }]`.
 * 
 * 5. 'binary_classifier': 
 *    - Operation: Rapid-fire binary choice (e.g., "Safe" vs "Threat").
 *    - Answer Schema: `items: [{ id, text, type: 'Safe' | 'Threat', hint }]`. The engine checks if `item.type` matches the button clicked.
 * 
 * 6. 'input_solver': 
 *    - Operation: User types a text answer and submits.
 *    - Answer Schema: `questions: [{ id, prompt, answer: '<exact_string>', hint }]`. 
 *      The engine does a case-insensitive, trimmed comparison with the `answer` string.
 * 
 * NOTE: All games award 115 points total, divided equally per item (115 / item_count). 
 * Incorrect answers deduct the exact same amount.
 */

export const MINIGAMES_CONTENT = {
  'ict-101': {
    title: 'Computer Hardware Components',
    type: 'matching',
    instructions: 'Match each internal/external hardware component to its primary function.',
    hint: 'Think about which component processes, which stores temporarily vs permanently, and which renders graphics.',
    pairs: [
      { id: 'p1', key: 'CPU', target: 'Executes instructions and processes data', hint: 'Known as the "brain" of the computer.' },
      { id: 'p2', key: 'RAM', target: 'Volatile high-speed temporary storage', hint: 'Loses all stored data when power is switched off.' },
      { id: 'p3', key: 'GPU', target: 'Accelerates visual rendering and graphics', hint: 'Specialized for parallel processing of 3D scenes and pixels.' },
      { id: 'p4', key: 'SSD', target: 'Non-volatile persistent flash storage', hint: 'Uses NAND flash memory with no moving mechanical parts.' },
      { id: 'p5', key: 'Motherboard', target: 'Main circuit board connecting all components', hint: 'Houses the socket, chipset, bus traces, and expansion slots.' }
    ]
  },
  'ict-102': {
    title: 'Operating Systems & Architecture',
    type: 'category',
    instructions: 'Sort the following OS components into Kernel Space or User Space.',
    hint: 'Kernel Space handles low-level hardware and privileges; User Space runs unprivileged applications.',
    categories: ['Kernel Space', 'User Space'],
    items: [
      { id: 'i1', text: 'Device Drivers', category: 'Kernel Space', hint: 'Directly controls hardware communication.' },
      { id: 'i2', text: 'Web Browser', category: 'User Space', hint: 'User application running in restricted ring 3 mode.' },
      { id: 'i3', text: 'Memory Management', category: 'Kernel Space', hint: 'Handles direct physical address allocation and page tables.' },
      { id: 'i4', text: 'Text Editor', category: 'User Space', hint: 'Interactive desktop utility software.' },
      { id: 'i5', text: 'Interrupt Handlers', category: 'Kernel Space', hint: 'Responds directly to hardware CPU signals.' }
    ]
  },
  'ict-103': {
    title: 'Computer Networking Basics',
    type: 'sequence',
    instructions: 'Arrange the OSI Model layers from Layer 1 (Bottom) to Layer 7 (Top).',
    hint: 'Remember: "Please Do Not Touch All" or Layer 1 is physical cables up to Layer 7 applications.',
    steps: [
      { id: 's1', text: 'Physical Layer (L1)', hint: 'Deals with raw bitstreams, cables, and signal voltages.' },
      { id: 's2', text: 'Data Link Layer (L2)', hint: 'Handles MAC addressing, Ethernet frames, and switches.' },
      { id: 's3', text: 'Network Layer (L3)', hint: 'Responsible for IP addressing and packet routing across networks.' },
      { id: 's4', text: 'Transport Layer (L4)', hint: 'Manages end-to-end communication via TCP and UDP protocols.' },
      { id: 's5', text: 'Application Layer (L7)', hint: 'Closest to the user; handles HTTP, FTP, and SMTP.' }
    ]
  },
  'ict-104': {
    title: 'Data Communication & Protocols',
    type: 'matching',
    instructions: 'Match standard network protocols to their default TCP/UDP port numbers.',
    hint: 'Unencrypted web uses 80, secure web uses 443, encrypted terminal shell uses 22.',
    pairs: [
      { id: 'p1', key: 'HTTP', target: 'Port 80', hint: 'Standard web protocol without SSL/TLS encryption.' },
      { id: 'p2', key: 'HTTPS', target: 'Port 443', hint: 'Secure encrypted web protocol over SSL/TLS.' },
      { id: 'p3', key: 'SSH', target: 'Port 22', hint: 'Secure shell remote administration protocol.' },
      { id: 'p4', key: 'DNS', target: 'Port 53', hint: 'Domain Name System operating mainly over UDP.' },
      { id: 'p5', key: 'FTP', target: 'Port 21', hint: 'File Transfer Protocol command channel.' }
    ]
  },
  'ict-105': {
    title: 'Web Technologies & Architecture',
    type: 'category',
    instructions: 'Classify each technology into Frontend or Backend stack.',
    hint: 'Frontend runs in the client browser UI; Backend executes on server logic or databases.',
    categories: ['Frontend', 'Backend'],
    items: [
      { id: 'i1', text: 'React.js', category: 'Frontend', hint: 'Declarative component-based client UI library.' },
      { id: 'i2', text: 'Node.js Express', category: 'Backend', hint: 'Server-side web framework executing JavaScript logic.' },
      { id: 'i3', text: 'CSS3 Grid', category: 'Frontend', hint: 'Browser layout engine for visual styling.' },
      { id: 'i4', text: 'PostgreSQL', category: 'Backend', hint: 'Relational database server for persistent storage.' },
      { id: 'i5', text: 'HTML5 Canvas', category: 'Frontend', hint: 'Browser API for rendering 2D graphics in client views.' }
    ]
  },
  'ict-106': {
    title: 'Information Systems & Databases',
    type: 'scenario',
    instructions: 'Solve database querying scenarios.',
    hint: 'Standard SQL syntax uses SELECT, FROM, WHERE, and ORDER BY keywords.',
    scenarios: [
      {
        id: 'sc1',
        prompt: 'Retrieve all active users from the "users" table ordered by join date.',
        hint: 'Use valid standard SQL query syntax with WHERE for filtering and ORDER BY for sorting.',
        options: [
          'SELECT * FROM users WHERE status = "active" ORDER BY joined_at DESC;',
          'GET ALL users WHERE active IS true SORT BY joined_at;',
          'FETCH * FROM users IF status == "active";',
          'SEARCH users WHERE status = active;'
        ],
        correct: 0
      },
      {
        id: 'sc2',
        prompt: 'Which key constraint uniquely identifies each record in a relational table?',
        hint: 'It cannot contain NULL values and must uniquely identify every row.',
        options: ['Foreign Key', 'Primary Key', 'Unique Constraint', 'Index Key'],
        correct: 1
      }
    ]
  },
  'ict-107': {
    title: 'System Administration & Security',
    type: 'input_solver',
    instructions: 'Solve file permission and administration challenges.',
    hint: 'Octal values: Read=4, Write=2, Execute=1. Total sum per triplet (User, Group, Others).',
    questions: [
      { id: 'q1', prompt: 'Convert Linux permission rwxr-xr-- into 3-digit octal notation.', answer: '754', hint: 'rwx = 4+2+1 = 7, r-x = 4+0+1 = 5, r-- = 4+0+0 = 4.' },
      { id: 'q2', prompt: 'Which command grants superuser privileges for a single execution on Linux?', answer: 'sudo', hint: 'Short for "SuperUser DO".' },
      { id: 'q3', prompt: 'Convert octal permission 644 into standard symbolic notation (e.g., rw-r--r--).', answer: 'rw-r--r--', hint: '6 = 4+2 (rw-), 4 = 4 (r--), 4 = 4 (r--).' }
    ]
  },
  'ict-108': {
    title: 'Cybersecurity Fundamentals',
    type: 'binary_classifier',
    instructions: 'Classify each incoming message or request as Safe or Phishing/Threat.',
    hint: 'Look for suspicious domains, double extensions like .pdf.exe, and unexpected urgent gift claims.',
    items: [
      { id: 'b1', text: 'Email from support@paypal-security-update.net asking to verify login.', type: 'Threat', hint: 'Suspicious domain name mimicking official brand.' },
      { id: 'b2', text: 'HTTPS login page on internal corporate domain company.com/login.', type: 'Safe', hint: 'Standard secure path on known internal domain.' },
      { id: 'b3', text: 'SMS offering $1,000 gift card if you click tinyurl.com/claim-now.', type: 'Threat', hint: 'Classic short-link smishing attempt promising fake rewards.' },
      { id: 'b4', text: 'GitHub notification email sent from notifications@github.com.', type: 'Safe', hint: 'Authentic domain notification address.' },
      { id: 'b5', text: 'Attachment named Urgent_Invoice.pdf.exe from unknown sender.', type: 'Threat', hint: 'Double file extension concealing an executable payload.' }
    ]
  },
  'ict-109': {
    title: 'Cloud Computing & Virtualization',
    type: 'category',
    instructions: 'Categorize each cloud computing feature, service, or virtualization concept into its correct model.',
    hint: 'IaaS provides raw infrastructure, PaaS supplies runtime environments, SaaS delivers ready software.',
    categories: ['IaaS', 'PaaS', 'SaaS', 'Virtualization'],
    items: [
      { id: 'item1', text: 'Raw virtual machines and block storage volumes', category: 'IaaS', hint: 'Infrastructure as a Service offers raw computational building blocks.' },
      { id: 'item2', text: 'Managed developer runtimes and database engines', category: 'PaaS', hint: 'Platform as a Service provides environments for application deployment.' },
      { id: 'item3', text: 'Ready-to-use web email and CRM applications', category: 'SaaS', hint: 'Software as a Service delivers end-user applications via browser.' },
      { id: 'item4', text: 'Type-1 bare-metal hypervisor running directly on physical hardware', category: 'Virtualization', hint: 'Bare-metal software layer managing virtual machine hardware abstraction.' }
    ]
  },
  'ict-110': {
    title: 'Network Security & Firewalls',
    type: 'scenario',
    instructions: 'Configure appropriate firewall rules for security threats.',
    hint: 'Blocking rules specify DENY action, traffic direction, source IP range, and target port.',
    scenarios: [
      {
        id: 'sc1',
        prompt: 'Block incoming unauthorized traffic targeting database port 5432 from external IP ranges.',
        hint: 'Use DENY for inbound traffic originating from 0.0.0.0/0 targeting port 5432.',
        options: [
          'DENY INBOUND TCP FROM 0.0.0.0/0 TO PORT 5432',
          'ALLOW INBOUND ALL TO PORT 5432',
          'REDIRECT PORT 5432 TO PORT 80',
          'DENY OUTBOUND UDP TO PORT 5432'
        ],
        correct: 0
      },
      {
        id: 'sc2',
        prompt: 'Allow secure HTTPS web traffic from any external source while blocking unsecured HTTP traffic.',
        hint: 'HTTPS utilizes port 443 for TLS encrypted traffic.',
        options: [
          'ALLOW INBOUND TCP FROM 0.0.0.0/0 TO PORT 443',
          'DENY INBOUND TCP FROM 0.0.0.0/0 TO PORT 443',
          'ALLOW INBOUND TCP FROM 0.0.0.0/0 TO PORT 80',
          'DENY INBOUND ALL TRAFFIC'
        ],
        correct: 0
      }
    ]
  },
  'ict-111': {
    title: 'Digital Systems & Logic',
    type: 'matching',
    instructions: 'Match standard digital logic gates to their output behavior.',
    hint: 'AND requires both 1s; OR requires at least one 1; XOR requires mismatching inputs; NAND inverts AND.',
    pairs: [
      { id: 'p1', key: 'AND Gate', target: 'Outputs 1 only if all inputs are 1', hint: 'Logical conjunction output.' },
      { id: 'p2', key: 'OR Gate', target: 'Outputs 1 if at least one input is 1', hint: 'Logical disjunction output.' },
      { id: 'p3', key: 'XOR Gate', target: 'Outputs 1 only if inputs are different', hint: 'Exclusive OR operation.' },
      { id: 'p4', key: 'NAND Gate', target: 'Outputs 0 only if all inputs are 1', hint: 'Negated AND gate output.' }
    ]
  },
  'ict-112': {
    title: 'IT Project Management',
    type: 'sequence',
    instructions: 'Sequence the traditional Waterfall SDLC phases in correct order.',
    hint: 'Requirements -> Design -> Coding -> Testing -> Deployment.',
    steps: [
      { id: 's1', text: 'Requirements Analysis', hint: 'Gathering client specifications prior to system layout.' },
      { id: 's2', text: 'System Design', hint: 'Architecting system models and data schemas.' },
      { id: 's3', text: 'Implementation / Coding', hint: 'Writing source code according to architecture designs.' },
      { id: 's4', text: 'Testing & QA', hint: 'Validating software functionality and bug verification.' },
      { id: 's5', text: 'Deployment & Maintenance', hint: 'Releasing to production servers and providing updates.' }
    ]
  },
  'ict-113': {
    title: 'E-Commerce & Digital Systems',
    type: 'category',
    instructions: 'Categorize system activities into Frontend Storefront or Backend Fulfillment.',
    hint: 'Frontend covers shopper-facing UI components; Backend handles warehouse, stock, and API settlements.',
    categories: ['Frontend Storefront', 'Backend Fulfillment'],
    items: [
      { id: 'i1', text: 'Product Catalog Display', category: 'Frontend Storefront', hint: 'Shopper browsing interface.' },
      { id: 'i2', text: 'Inventory Stock Deduction', category: 'Backend Fulfillment', hint: 'Server database record updates upon purchase.' },
      { id: 'i3', text: 'Shopping Cart UI', category: 'Frontend Storefront', hint: 'Client state management for selected items.' },
      { id: 'i4', text: 'Payment Gateway Settlement API', category: 'Backend Fulfillment', hint: 'Secure server communication with payment processor APIs.' }
    ]
  },
  'ict-114': {
    title: 'Emerging Technologies & AI Integration',
    type: 'matching',
    instructions: 'Match modern technology terms with their primary application.',
    hint: 'LLM = language models; Blockchain = immutable ledger; Edge = localized compute; Quantum = qubits.',
    pairs: [
      { id: 'p1', key: 'LLM', target: 'Generative natural language processing', hint: 'Large language models like GPT engines.' },
      { id: 'p2', key: 'Blockchain', target: 'Decentralized immutable ledger', hint: 'Cryptographic block chain maintaining distributed consensus.' },
      { id: 'p3', key: 'Edge Computing', target: 'Processing data near source devices', hint: 'Computing close to IoT hardware rather than distant data centers.' },
      { id: 'p4', key: 'Quantum Computing', target: 'Qubit-based superposition processing', hint: 'Utilizes quantum mechanics states for complex parallel calculations.' }
    ]
  },
  'cs-201': {
    title: 'Discrete Structures & Logic',
    type: 'input_solver',
    instructions: 'Solve boolean truth evaluation tasks.',
    hint: 'AND requires both operands True; XOR requires exactly one operand True.',
    questions: [
      { id: 'q1', prompt: 'Given A = True, B = False. What is A AND (NOT B)? (Answer True or False)', answer: 'True', hint: 'NOT False equals True, so True AND True evaluates to True.' },
      { id: 'q2', prompt: 'Given A = False, B = False. What is A XOR B? (Answer True or False)', answer: 'False', hint: 'XOR outputs True only when the two inputs differ.' },
      { id: 'q3', prompt: 'What is the negation of (A OR B) according to De Morgan\'s Law?', answer: 'NOT A AND NOT B', hint: 'De Morgan law converts OR to AND and negates both terms.' }
    ]
  },
  'cs-202': {
    title: 'Data Structures & Algorithms',
    type: 'input_solver',
    instructions: 'Analyze algorithm time complexities and tracer execution.',
    hint: 'QuickSort divides and conquers (N log N); Stack is LIFO; Binary Search halves sorted bounds.',
    questions: [
      { id: 'q1', prompt: 'What is the average time complexity of QuickSort? (Format: O(N log N))', answer: 'O(N log N)', hint: 'Divide-and-conquer sorting algorithm performance.' },
      { id: 'q2', prompt: 'What data structure operates on a Last-In, First-Out (LIFO) order?', answer: 'Stack', hint: 'Think of a stack of plates where top item is retrieved first.' },
      { id: 'q3', prompt: 'What is the worst-case time complexity of Binary Search on a sorted array of N elements?', answer: 'O(log N)', hint: 'Halving search space at each comparison step.' }
    ]
  },
  'cs-203': {
    title: 'Advanced Database Systems',
    type: 'scenario',
    instructions: 'Formulate correct SQL queries for data management scenarios.',
    hint: 'Filtering aggregated groups requires HAVING, not WHERE.',
    scenarios: [
      {
        id: 'sc1',
        prompt: 'Retrieve total revenue per department where total sales exceed $50,000.',
        hint: 'Aggregated functions like SUM() must be placed in a HAVING clause after GROUP BY.',
        options: [
          'SELECT dept, SUM(sales) FROM orders GROUP BY dept HAVING SUM(sales) > 50000;',
          'SELECT dept, SUM(sales) FROM orders WHERE SUM(sales) > 50000 GROUP BY dept;',
          'SELECT dept FROM orders WHERE sales > 50000 GROUP BY TOTAL;',
          'FETCH DEPT, SALES FROM orders HAVING sales > 50000;'
        ],
        correct: 0
      },
      {
        id: 'sc2',
        prompt: 'Which index type is optimal for fast point lookups on unique primary key identifiers?',
        hint: 'Standard balanced tree structures provide O(log N) equality and range searches.',
        options: ['B-Tree Index', 'Full-Text Index', 'Spatial Index', 'Bitmap Index'],
        correct: 0
      }
    ]
  },
  'cs-204': {
    title: 'Computer Architecture & Assembly',
    type: 'matching',
    instructions: 'Match assembly registers/instructions to their functions.',
    hint: 'EAX/RAX = Math accumulator; ESP/RSP = Stack Pointer; EIP/RIP = Instruction Pointer.',
    pairs: [
      { id: 'p1', key: 'EAX / RAX', target: 'Accumulator register for arithmetic operations', hint: 'Primary register used for returning function values and math calculation.' },
      { id: 'p2', key: 'ESP / RSP', target: 'Stack Pointer register pointing to top of stack', hint: 'Tracks the top active memory address on stack.' },
      { id: 'p3', key: 'EIP / RIP', target: 'Instruction Pointer pointing to next executable byte', hint: 'Holds address of the next assembly instruction to run.' },
      { id: 'p4', key: 'MOV', target: 'Copies data from source operand to destination', hint: 'Standard load/copy operation in x86 architecture.' }
    ]
  },
  'cs-205': {
    title: 'Operating Systems Principles',
    type: 'sequence',
    instructions: 'Order CPU scheduling process lifecycle states from creation to completion.',
    hint: 'New -> Ready -> Running -> Blocked -> Terminated.',
    steps: [
      { id: 's1', text: 'New (Process Created)', hint: 'Process memory being allocated by OS.' },
      { id: 's2', text: 'Ready (Waiting for CPU allocation)', hint: 'Loaded in memory waiting in process scheduler queue.' },
      { id: 's3', text: 'Running (Executing on CPU)', hint: 'Instructions active on CPU core.' },
      { id: 's4', text: 'Waiting / Blocked (I/O operation)', hint: 'Paused waiting for external disk or network I/O signal.' },
      { id: 's5', text: 'Terminated (Execution Finished)', hint: 'Process context cleared and resources reclaimed.' }
    ]
  },
  'cs-206': {
    title: 'Theory of Computation',
    type: 'category',
    instructions: 'Classify grammars into Regular vs Context-Free in Chomsky Hierarchy.',
    hint: 'Regular languages use finite automata/regex; Context-Free languages require pushdown automata/stacks.',
    categories: ['Regular Language', 'Context-Free Language'],
    items: [
      { id: 'i1', text: 'DFA / NFA Recognizable', category: 'Regular Language', hint: 'Deterministic and Nondeterministic Finite Automata.' },
      { id: 'i2', text: 'Pushdown Automata Recognizable', category: 'Context-Free Language', hint: 'Automata equipped with a stack mechanism.' },
      { id: 'i3', text: 'Regex without back-references', category: 'Regular Language', hint: 'Standard state-machine based regular expressions.' },
      { id: 'i4', text: 'Balanced Parentheses Matching', category: 'Context-Free Language', hint: 'Requires memory stack to track nested pairs.' }
    ]
  },
  'cs-207': {
    title: 'Software Engineering & Design',
    type: 'matching',
    instructions: 'Match Design Patterns with their architectural classification.',
    hint: 'Singleton/Factory = Creational; Adapter = Structural; Observer = Behavioral.',
    pairs: [
      { id: 'p1', key: 'Singleton', target: 'Creational Pattern ensuring a single instance', hint: 'Restricts class instantiation to a single global object.' },
      { id: 'p2', key: 'Adapter', target: 'Structural Pattern enabling incompatible interfaces to collaborate', hint: 'Translates one class interface into another anticipated by clients.' },
      { id: 'p3', key: 'Observer', target: 'Behavioral Pattern notifying subscribers of state changes', hint: 'Pub/Sub pattern for event handling across components.' },
      { id: 'p4', key: 'Factory Method', target: 'Creational Pattern delegating instantiation to subclasses', hint: 'Defines creation interface while subclasses decide concrete class.' }
    ]
  },
  'cs-208': {
    title: 'Compiler Construction',
    type: 'sequence',
    instructions: 'Order compiler phases in execution sequence from raw source to machine target.',
    hint: 'Tokenize -> Parse AST -> Semantic Types -> Intermediate Code -> Optimize/Output Machine Code.',
    steps: [
      { id: 's1', text: 'Lexical Analysis (Tokenization)', hint: 'Converts raw string text into token stream.' },
      { id: 's2', text: 'Syntax Analysis (Parsing / AST Generation)', hint: 'Builds Abstract Syntax Trees according to language grammar.' },
      { id: 's3', text: 'Semantic Analysis (Type Checking)', hint: 'Verifies symbol types, scope scopes, and variable definitions.' },
      { id: 's4', text: 'Intermediate Code Generation', hint: 'Translates AST into language-independent intermediate representation (IR).' },
      { id: 's5', text: 'Code Optimization & Target Code Generation', hint: 'Optimizes IR and produces machine binaries or assembly.' }
    ]
  },
  'cs-209': {
    title: 'Computer Networks & Security',
    type: 'binary_classifier',
    instructions: 'Classify security mechanisms into Symmetric or Asymmetric Encryption.',
    hint: 'Symmetric uses a single shared secret key; Asymmetric uses public/private key pairs.',
    items: [
      { id: 'b1', text: 'AES-256 (Advanced Encryption Standard)', type: 'Symmetric', hint: 'Block cipher relying on a single shared key.' },
      { id: 'b2', text: 'RSA Keypair Public/Private Keys', type: 'Asymmetric', hint: 'Public key encrypts while private key decrypts.' },
      { id: 'b3', text: 'ChaCha20 Stream Cipher', type: 'Symmetric', hint: 'Fast stream cipher using shared secret key.' },
      { id: 'b4', text: 'ECC (Elliptic Curve Cryptography)', type: 'Asymmetric', hint: 'Mathematical elliptic curves generating public/private keys.' }
    ]
  },
  'cs-210': {
    title: 'Distributed Systems',
    type: 'scenario',
    instructions: 'Solve distributed systems consistency challenges.',
    hint: 'CAP Theorem: Consistency, Availability, Partition Tolerance (pick 2 of 3 under network failure).',
    scenarios: [
      {
        id: 'sc1',
        prompt: 'According to the CAP Theorem, when network partition occurs, a system must choose between which guarantees?',
        hint: 'During network partition (P), you must compromise either node sync accuracy (C) or system uptime (A).',
        options: [
          'Consistency OR Availability',
          'Latency OR Throughput',
          'Redundancy OR Security',
          'Concurrency OR Encryption'
        ],
        correct: 0
      }
    ]
  },
  'cs-211': {
    title: 'Artificial Intelligence & Machine Learning',
    type: 'category',
    instructions: 'Sort Machine Learning algorithms into Supervised or Unsupervised Learning.',
    hint: 'Supervised relies on target output labels; Unsupervised identifies hidden patterns in unlabeled data.',
    categories: ['Supervised Learning', 'Unsupervised Learning'],
    items: [
      { id: 'i1', text: 'Linear Regression', category: 'Supervised Learning', hint: 'Predicts continuous numeric targets based on labeled datasets.' },
      { id: 'i2', text: 'K-Means Clustering', category: 'Unsupervised Learning', hint: 'Groups unlabeled data into cluster centers.' },
      { id: 'i3', text: 'Random Forest Classifier', category: 'Supervised Learning', hint: 'Ensemble decision trees trained on labeled data.' },
      { id: 'i4', text: 'Principal Component Analysis (PCA)', category: 'Unsupervised Learning', hint: 'Dimensionality reduction technique on unlabeled data.' }
    ]
  },
  'cs-212': {
    title: 'Computer Graphics & Vision',
    type: 'matching',
    instructions: 'Match Computer Graphics terms with their core concepts.',
    hint: 'Ray Tracing = light physics; Rasterization = vector to pixels; Shaders = GPU program; Texture = 2D image skin.',
    pairs: [
      { id: 'p1', key: 'Ray Tracing', target: 'Simulates path of light rays for realistic reflections/shadows', hint: 'Traces optical light physics paths backwards from camera.' },
      { id: 'p2', key: 'Rasterization', target: 'Converts vector geometry graphics into pixel grids', hint: 'Maps 3D polygon mesh vertices into 2D screen pixels.' },
      { id: 'p3', key: 'Shaders', target: 'Programmable GPU code calculating light and color renders', hint: 'Custom programs executing on GPU pipelines (vertex/fragment).' },
      { id: 'p4', key: 'Texture Mapping', target: 'Applies 2D bitmap imagery onto 3D surfaces', hint: 'Pipes image UV coordinates onto 3D polygon meshes.' }
    ]
  }
};
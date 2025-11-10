<script>
    import Entry from "$lib/components/entry.svelte";
</script>

<div class="header-container">
    <img class="header-image" src="/images/v11_47.png">
    <div class="name-container">
        <h1>Isaiah Murray</h1>
        <sub>ECE Student at the <a href="https://olin.edu">Olin College of Engineering</a></sub>
    </div>
</div>

<div class="content-container">
    <h1>Experience</h1>
    <div class="experience-container">
        <Entry width="400" title="SCRIBBLE WORLDS ACTIVITY BOOK" subtitle="Inventor and Co-founder" date="2016 - present" description="Invented Scribble Worlds (www.scribbleworlds.com) with father, combining love of Dungeons and Dragons, Rogue-like adventure games, and video games with love of creating physical objects. Created a process for laser cutting complex paper shapes to support industrial (well, cottage-industry) production. Helped create final game and marketing content. Worked with parents to submit patent and trademark for the business."></Entry>
        <Entry title="CSCR" subtitle="Student researcher and volunteer - shellfish survey, water quality, drifter teams" date="2016 - 2022" description="Applied & received Marjot grant to study Zostera marina. Analyzed recovery conditions for Labyrinthula zosterae infected specimens by constructing and testing an automated artificial environment."></Entry>
        <Entry title="CHERISH HEALTH" subtitle="Machine Learning Intern" date="2022, 2024-2025" description="Applied for and received internship at Cherish Health for the summer of 2022. Supported CEO and CTO with user demos in support of their successful Series A investment round. Supported engineering team with machine learning data collection and network training. Developed skills in product demos, CAD, Python, and TensorFlow. Returned to Cherish Health as a full time employee during gap year prior to college. Working to calibrate phased radar arrays, speed up state annotation, built internal interface for storing and comparing characterization data, organized contractors for MFP, manufactured injection-molded and machined wood components. Became proficient with GCloud, Gitlab, Solidworks, KeyShot."></Entry>
        <Entry title="MATHNASIUM" subtitle="Math Tutor" date="2022-2024" description="Applied for and received job as a math tutor at Mathnasium in Cohasset at the age of 14, have tutored there since. Working with children from the 3rd grade to the 8th grade. Working with owner to build life skills beyond tutoring."></Entry>
        <Entry title="MEOWGIC CARDS LLC" subtitle="Co-founder, Artist, Tester" date="2020-present" description="Supported creating Meowgic Cards LLC (www.meowgiccards.com), a parody trading card game with four card decks created. Helped create and review business plan, website content, some artistic content, and test game."></Entry>
        <Entry title="FRENCH MEMORIES BAKERY" subtitle="Counter Work, Food Service, Kitchen Support" date="2022-2022" description="Worked cash register, filled customer orders, made and served meals, provided general kitchen support."></Entry>
        <Entry title="ACCESS SPORT AMERICA" subtitle="Coach" date="2024-2025" description="Working at a program providing accessible watersports to disabled individuals."></Entry>
    </div>
    <h1>Education</h1>
    <div class="education-container">
            <Entry width="5000" title="OLIN COLLEGE OF ENGINEERING" subtitle="Electrical and Computer Engineering" date="2025 – 2029" description="Pursuing an ECE education through project-based classes. Utilized biomimicry to inspire weight-efficient jumping mechanisms in DESNAT; Created a facial recognition program through QEA1; compared various epidemiology models in MODSIM. Member of the Baja off-road racing team electronics division - implemented a ride height sensor for suspension tuning, building a CAN-based data collection and diagnostic sensor canopy. Play Rugby and MMA through Babson. Involved with the Babson Mazda Miata racing team. Skilled in SolidWorks, MATLAB."></Entry>
        <Entry width="5000" title="NUVU INNOVATION SCHOOL" subtitle="8th-12th grade" date="2020 – 2024" description="Project based learning studios and seminars. John’s Hopkins CTY courses in Bio, Chem, AP Chem, and Essay Writing. Math courses through Art of Problem solving include Intermediate Algebra, Precalculus, AP Calculus. Took Multivariable Calculus, CS50, and CSCI-e80 through Harvard Extension School"></Entry>
        <Entry width="5000" title="COHASSET MIDDLE SCHOOL" subtitle="7th grade" date="2019-2020" description="Moved to Cohasset, built strong friendships, earned straight A’s including in extracurricular AoPS Geometry and Intermediate Algebra courses. Tested into Johns Hopkins Center for Talented Youth via their SSAT equivalent."></Entry>
        <Entry width="5000" title="HOMESCHOOL" subtitle="K-6th grade" date="2010-2019" description="My homeschooling experience focused on a solid core of studies around english, science, and math, as well as plenty of free time to focus on my passion around STEM - programming, making, electronics, and more."></Entry>
    </div>
    <h1>Community</h1>
    <p>Member of Cohasset Middle School and High School Robotics teams, Cohasset Maritime Institute Rowing, Cohasset Sailing Club, CSCR, Hingham Sailing Club, Volunteering activities through the Cohasset UU Youth Program.</p>
</div>

<style>
    .content-container h1 {
        margin-bottom: 10px;
        margin-top: 40px;
    }
    .experience-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        width: 100%;
    }

    .education-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        width: 100%;
    }

    .content-container {
        margin: 25px;
        font: 20px Inter, sans-serif;
    }

    .header-image {
        object-fit: cover;
        width: 100%;
        max-height: 45vh;
        height: auto;
    }

    .header-container {
        position: relative;
    }

    .name-container {
        position: absolute;
        width: 100%;
        left: 25px;
        bottom: 25px;
        color: #FDF6D6;
        font: 32px Inter, sans-serif;
    }

    .name-container h1 {
        margin: 0;
        position: absolute;
        bottom: 22px;
        font-weight: 800;
        color: #FDF6D6;
        font-size: 64px;
    }

    .name-container sub {
        margin: 0;
        font: 24px Inter, sans-serif;
        width: 100%;
        font-weight: 100;
        position: absolute;
        bottom: 0px;
    }

    .name-container sub a {
        color: #009DD1;
        text-decoration: none;
    }

    .name-container sub a:hover {
        font-weight: 700;
        transform: scale(1.5);
    }

    @media (max-width: 768px) {
        .name-container {
            left: 15px;
            bottom: 15px;
            font-size: 24px;
        }
        .name-container h1 {
            font-size: 48px;
            bottom: 15px;
        }
        .name-container sub {
            font-size: 18px;
            bottom: 0px;
        }
    }

    @media (max-width: 480px) {
        .name-container {
            left: 10px;
            bottom: 10px;
            font-size: 20px;
        }
        .name-container h1 {
            font-size: 32px;
            bottom: 10px;
        }
        .name-container sub {
            font-size: 14px;
            bottom: 0px;
        }
    }
</style>

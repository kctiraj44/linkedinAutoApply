//This is send_application.js

const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const { answersDatabase, saveAnswer, handleNewQuestion, calculateSimilarity, getMostSimilarQuestion, normalizeAndTokenize } = require('./utils_Numeric.js');
const { answerDropDown, handleNewAnswerDropDown } = require('./utils_DropDown');
const { answerBinaryQuestions, handleNewQuestionBinary} = require('./utils_Binary.js');
const { safeSelectOption } = require('./utils_DropDown.js');



//------------------------------------------------1.Numeric response HANDLER-------------------------

async function answerNumericQuestions(page) {
  const questionElements = await page.$$('label.artdeco-text-input--label'); // Ensure you select the right labels
  for (let questionElement of questionElements) {
    const questionText = await questionElement.textContent();
    console.log("Question", questionText);
    // Find the corresponding input element using the 'for' attribute of the label
    const inputId = await questionElement.getAttribute('for');
    const answerElement = await page.$(`#${inputId}`);

    // Get the most similar question from the answers database
    const result = getMostSimilarQuestion(questionText.trim());
    let mostSimilarQuestion = null;
    let maxSimilarity = 0;

    if (result) {
      mostSimilarQuestion = result.mostSimilarQuestion;
      maxSimilarity = result.maxSimilarity;
    }

    let answer = null;
    if (mostSimilarQuestion && maxSimilarity > 0.7) {
      // Retrieve answer from the answers database
      answer = answersDatabase[mostSimilarQuestion];
    } else {
      // Handle new question
      answer = await handleNewQuestion(questionText.trim());
    }

    // Ensure the input element is present and fill it with the answer
    if (answerElement && answer !== null) {
      await answerElement.fill(answer);
    } else {
      console.log(`No answer found or no suitable question found for: "${questionText.trim()}".`);
    }
  }
}


// -------------------RESPONSE HANDLER---------------

async function answerQuestions(page){
  await  answerNumericQuestions(page)
  await  answerBinaryQuestions(page)
  await answerDropDown(page)

  // 📜 Handle textareas (like Cover Letter)
  const textAreas = await page.$$('textarea');
  for (const area of textAreas) {
    const labelElement = await area.evaluateHandle(node => node.closest('div')?.querySelector('label'));
    const label = labelElement ? await labelElement.evaluate(node => node.innerText) : '';

    if (label && label.toLowerCase().includes('cover letter')) {
      const coverLetterText = `Tiraj KC
Virginia, US
tirajkc@gmail.com | 840-777-6140


April 28, 2025

Dear Hiring Manager,

I am excited to apply for the Software Engineer position at your esteemed organization. With over six years of professional experience in developing scalable, high-performing applications using Java, Spring Boot, RESTful APIs, and cloud technologies like AWS and GCP, I am confident that I can contribute effectively to your team’s goals.

Throughout my career, I have delivered measurable results, such as improving system performance by 30% at American Express and boosting backend efficiency through microservices development at Fidelity Investments. I thrive in Agile environments, practicing Extreme Programming, Test-Driven Development, and pair programming to ensure high code quality and faster delivery. My technical toolkit spans Java (8/11), Spring Boot, Hibernate, Kafka, Docker, Kubernetes, Angular, and ReactJS, alongside expertise in database management and DevOps pipelines.

Beyond technical skills, I bring a strong problem-solving mindset, a commitment to continuous learning, and a passion for building user-centric solutions. I hold a Bachelor’s degree in Computer Science (GPA 3.96/4.0) and am currently pursuing my Master’s in Information Technology at the University of the Cumberlands.

I am enthusiastic about the opportunity to bring my experience and energy to your team. I look forward to the possibility of discussing how my background, skills, and ambitions align with the needs of your organization. Thank you for considering my application.

Sincerely,
Tiraj KC`;

      await area.fill(coverLetterText);
      console.log("📝 Filled cover letter field successfully.");
    }
  }
}




async function handleNextOrReview(page) {
  let hasNextButton = true;

  while (hasNextButton) {
    try {
      const nextButton = await page.$('button[aria-label="Continue to next step"]');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(3000); // Wait for the next step to load
        // await answerQuestions(page);
        // Fill Location City if asked
try {
  const locationInput = await page.getByLabel('Location (city)', { exact: true });
  if (locationInput) {
    await locationInput.fill('Falls Church, Virginia, USA');
    console.log('Filled Location field with Falls Church, Virginia, USA');
  }
} catch (e) {
  console.log('Location (city) field not found, skipping...');
}

      } else {
        hasNextButton = false; // No more "Next" buttons found
      }
    } catch (error) {
      hasNextButton = false; // Exit loop if any error occurs (e.g., button not found)
    }
  }

  // Handle the review step
  try {
    const reviewButton = await page.$('button[aria-label="Review your application"]');
    if (reviewButton) {
       await reviewButton.click();
      // Handle the review step
try {
  const reviewButton = await page.$('button[aria-label="Review your application"]');
  if (reviewButton) {
    console.log("Clicking Review...");
    await reviewButton.evaluate(b => b.click());
    await page.waitForTimeout(2000);

    console.log("Review button successfully clicked");
  }

  const submitButton = await page.$('button[aria-label="Submit application"]');
  if (submitButton) {
    await submitButton.evaluate(b => b.click());
    console.log("Submit button clicked");
  }

  await page.waitForTimeout(5000);
  await page.waitForSelector('button[aria-label="Dismiss"]', { visible: true });
  let modalButton = await page.$('button[aria-label="Dismiss"]');
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      await modalButton.evaluate(b => b.click());
      console.log("Dismiss button clicked");
      break; // Exit loop if click is successful
    } catch (error) {
      console.log(`Attempt ${attempts + 1} failed: ${error.message}`);
      attempts++;
      await page.waitForTimeout(500); // Wait before retrying
      modalButton = await page.$('button[aria-label="Dismiss"]'); // Re-select the button
    }
  }

} catch (error) {
  console.log('Error during review step:', error.message);
}

      console.log("Review button successfully clicked");

      const submitButton = await page.$('button[aria-label="Submit application"]');
      if (submitButton) {
        // await submitButton.click();
        await submitButton.evaluate(b => b.click());

        console.log("Submit button clicked");

        await page.waitForTimeout(5000);
        await page.waitForSelector('button[aria-label="Dismiss"]', { visible: true });
        let modalButton = await page.$('button[aria-label="Dismiss"]');
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          try {
            await modalButton.evaluate(b => b.click());
            console.log("Dismiss button clicked");
            break; // Exit loop if click is successful
          } catch (error) {
            console.log(`Attempt ${attempts + 1} failed: ${error.message}`);
            attempts++;
            await page.waitForTimeout(500); // Wait before retrying
            modalButton = await page.$('button[aria-label="Dismiss"]'); // Re-select the button
          }
        }

        if (attempts === maxAttempts) {
          console.log("Failed to click the Dismiss button after multiple attempts.");
        }
      }
    }
  } catch (error) {
    console.log('Review button not found or failed to click:', error.message);
  }
}



//--------- Main assist Funtions--------------

async function fillPhoneNumber(page, phoneNumber) {
  try {
    let inputElement;

    // Try common patterns (name, id, aria-label, placeholder)
    const possibleSelectors = [
      'input[name*="phone"]',
      'input[id*="phone"]',
      'input[aria-label*="phone"]',
      'input[placeholder*="phone"]',
      'input[type="tel"]'
    ];

    for (const selector of possibleSelectors) {
      inputElement = await page.locator(selector).first();
      if (await inputElement.count() > 0) {
        await inputElement.scrollIntoViewIfNeeded();
        await inputElement.fill(phoneNumber);
        console.log(`📞 Filled phone number using selector: ${selector}`);
        return;
      }
    }

    console.warn("⚠️ Phone input field not found using common selectors.");
  } catch (error) {
    console.error("❌ Error while filling phone number:", error);
  }
}


async function getJobName(page) {
  try {
    // Use XPath to select the job name element
    const jobNameElement = await page.$('//h1[contains(@class,"t-24 t-bold")]//a[1]');
    if (jobNameElement) {
      const jobName = await jobNameElement.textContent();
      return jobName.trim();
    } else {
      return "Unknown Job"; // Fallback if job name is not found
    }
  } catch (error) {
    console.error("Error extracting job name:", error);
    return "Unknown Job";
  }
}



//###########################-----------MAIN FUNCTION----------###############################
(async () => {
  const browser = await chromium.launch({ headless: false });
 
  /*const browser = await chromium.launch({ 
    headless: false, 
    channel: 'chrome' // Use Chrome channel
  });*/
 
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try{
  await page.goto('https://www.linkedin.com/login');
  
  //-----------------------------------1.Login-----------------------------------------------
  //1.Auto Login
  await page.fill('input[name="session_key"]', 'tirajkc@gmail.com');
  await page.fill('input[name="session_password"]', 'Mynepal150*');
  await page.click('button[type="submit"]');
  
  //2.Maual Login
  //console.log('Please log in to LinkedIn manually.');
  
  await page.waitForSelector('a.global-nav__primary-link--active', { timeout: 0 });  //Wait until the login is complete AND reaches Home Page
  console.log('Login was Sucessfull');
  
  //---------------------------2.Go to Job Search-----------------------------------------------
  
  await page.goto('https://www.linkedin.com/jobs/');
  
  //Action 1.JOB SEARCH KEYWORD
  
  await page.waitForTimeout(3000)
  await page.getByRole('combobox', { name: 'Search by title, skill, or' }).click();
  await page.waitForTimeout(3000)

  await page.getByRole('combobox', { name: 'Search by title, skill, or' }).fill('Java developer');
  // Fill Location
  await page.getByRole('combobox', { name: 'City, state, or zip code' }).fill('Washington DC-Baltimore Area');
  await page.waitForTimeout(1000);

  await page.getByRole('combobox', { name: 'Search by title, skill, or' }).press('Enter');
  await page.waitForTimeout(5000)

  //Action 2.Select FILTERS
  //Select EASY APPLY FILTER BY DEFAULT
  await page.waitForSelector("//button[@aria-label='Easy Apply filter.']");
  await page.click("//button[@aria-label='Easy Apply filter.']");
  

  console.log("No filters applied (Easy Apply disabled)");
  await page.waitForTimeout(3000);
  
  //------------------------------------3.Start Applying Jobs-----------------------------------------------
  
  let currentPage = 1;
  let jobCounter = 0;

  while (true) {
    console.log(`Navigating to page ${currentPage}`);

  const jobListings = await page.$$('//div[contains(@class,"display-flex job-card-container")]');
  console.log(`Number of job listed on page ${currentPage}: ${jobListings.length}`);

  if (jobListings.length === 0) {
    console.log(`No jobs found on page ${currentPage}. Exiting.`);
    break;
  }

  // Start applying jobs in Current Page
  for (let job of jobListings) {
    
    jobCounter++;
    console.log(`Processing job ${jobCounter} on page ${currentPage}`);
  
    const someButton = await job.$('a.job-card-container__link');
    if (!someButton) {
      console.warn("⚠️ Could not find job link on job card. Skipping...");
      continue;
    }
    
    try {
      await someButton.scrollIntoViewIfNeeded();
      await someButton.click();
      await page.waitForTimeout(2000);
      await page.waitForSelector('.jobs-details__main-content', { timeout: 5000 });
    } catch (err) {
      console.warn('⚠️ Normal click failed. Trying force click...');
      try {
        await someButton.scrollIntoViewIfNeeded();
        await someButton.click({ force: true });
        await page.waitForTimeout(2000);
        await page.waitForSelector('.jobs-details__main-content', { timeout: 5000 });
      } catch (forceErr) {
        console.error('❌ Even force click failed. Skipping this job.');
        continue;
      }
    }
    
    


        
    //----------------------------------CASE 1: ALREADY APPLIED----------------
    
    const alreadyAppliedElements = await page.$$('span.artdeco-inline-feedback__message:has-text("Applied")');
if (alreadyAppliedElements.length > 0) {

      const jobNameElement = await page.$('//h1[contains(@class,"t-24 t-bold")]//a[1]');
      const jobName = jobNameElement ? (await jobNameElement.textContent()).trim() : 'Unknown Job';
      console.log(`Already applied to: ${jobName}. Skipping.`);
      continue;
  }
  

    
    //----------------------------------CASE 2: NOT EASY APPLY---------------
    
    let easyApplyButton

    try {
      easyApplyButton = await page.waitForSelector('button.jobs-apply-button', { timeout: 5000 });
      await page.waitForTimeout(1000); // small pause before clicking
      await easyApplyButton.click();
      console.log('✅ Easy Apply button clicked successfully.');
    } catch (error) {
      console.warn('⚠️ Normal click failed, trying force click...');
      try {
        await easyApplyButton.click({ force: true });
        console.log('✅ Force click on Easy Apply successful.');
      } catch (forceError) {
        console.error('❌ Even force click failed. Skipping this job.');
        continue; // If force click also fails, skip this job
      }
    }
    

    //----------------------------------CASE 3: APPLYING NOW ------------------
    
    await page.waitForTimeout(3000)

    // -------------- Fill the Static Data ------------------- 
 
    // 1.Check for both possible email labels and select the email address
    const emailLabel = await page.$('label:has-text("Email address")') || await page.$('label:has-text("Email")');
    if (emailLabel) {
      const emailInputId = await emailLabel.getAttribute('for');
      await page.selectOption(`#${emailInputId}`, 'tirajkc@gmail.com');
    }

    // 2.Attempt to select the phone country code from the dropdown
    try {
      const phoneCountryLabel = await page.$('label:has-text("Phone country code")');
      if (phoneCountryLabel) {
        const phoneCountryInputId = await phoneCountryLabel.getAttribute('for');
        // await page.selectOption(`#${phoneCountryInputId}`, { value: 'us' });
         //await page.selectOption(`#${phoneCountryInputId}`, { label: 'US (+1)' }); 
         await safeSelectOption(page, `#${phoneCountryInputId}`, { label: 'United States (+1)' });
         try {
          const emailLabel = await page.$('label:has-text("Email address")') || await page.$('label:has-text("Email")');
          if (emailLabel) {
            const emailInputId = await emailLabel.getAttribute('for');
            if (emailInputId) {
              await safeSelectOption(page, `#${emailInputId}`, { label: 'tirajkc@gmail.com' });
            } else {
              console.warn("⚠️ Email label found, but no 'for' attribute");
            }
          } else {
            console.warn("⚠️ No email label found");
          }
        } catch (e) {
          console.error("❌ Email dropdown block failed:", e.message);
        }
        
   



      }
    } catch (error) {
      console.log('Phone country code dropdown not found:', error.message);
    }

    // 3.Check for both possible phone labels and fill in the phone number
 
   // Ensure the modal is visible before proceeding
   try {
    await page.waitForSelector('.artdeco-modal', { visible: true, timeout: 10000 });
    console.log("✅ Easy Apply modal appeared.");

    // ✅ Handle "Job search safety reminder" modal
try {
  const safetyReminder = await page.$('h2:has-text("Job search safety reminder")');
  if (safetyReminder) {
    console.log("⚠️ Safety reminder modal detected.");
    const continueButton = await page.$('button:has-text("Continue applying")');
    if (continueButton) {
      await continueButton.click();
      console.log("➡️ Clicked Continue Applying.");
      await page.waitForTimeout(2000);
    }
  }
} catch (e) {
  console.warn("⚠️ Safety reminder handler failed:", e.message);
}

  
    // ✨ Add this extra wait to ensure fields inside modal load
    await page.waitForTimeout(2000);
  } catch (e) {
    console.warn("⚠️ Easy Apply modal didn't appear in time, skipping this job.");
    continue;
  }
  
  
// ✅ Wait for the overlay spinner to disappear (prevents DOM not found errors)
try {
  await page.waitForSelector('.artdeco-modal__overlay-loading', { state: 'hidden', timeout: 5000 });
  console.log("✅ Modal overlay cleared, continuing...");
} catch (e) {
  console.warn("⚠️ Overlay may still be present, proceeding cautiously.");
}

// 3. Check for both possible phone labels and fill in the phone number
try {
  await fillPhoneNumber(page, '840-777-6140');
} catch (error) {
  console.error('Phone number field not found or failed to fill:', error.message);
}




    // 3b. Fill Summary if field exists
try {
  const summaryLabel = await page.$('label:has-text("Summary")');
  if (summaryLabel) {
      const summaryInputId = await summaryLabel.getAttribute('for');
      const summaryInput = await page.$(`#${summaryInputId}`);
      if (summaryInput) {
          await summaryInput.fill(`Highly motivated Software Engineer with 6+ years of experience in Java, Spring Boot, REST APIs, cloud technologies (AWS, GCP), and microservices development. Proven success improving system performance by 30% at American Express. Strong in Agile methodologies, TDD, and DevOps practices. Passionate about delivering scalable, user-centric solutions. Pursuing MS in Information Technology.`);
          console.log('✅ Filled Summary');
      }
  }
} catch (error) {
  console.warn('⚠️ No Summary field found or failed to fill.');
}

    

    // 4.Attach Resume
    //No need to attach resume every time its Auto Attached ; commented to reduce unnecessary WAIT
    /*try{
    await page.setInputFiles('input[type="file"]', 'Cashier Resume.pdf');
    }
    catch(error){
      continue;
    }*/
 // ✅ Handle Resume Upload Selection Modal
try {
  const resumeModal = await page.$('div[role="dialog"] h2:has-text("Apply to")');
  if (resumeModal) {
    console.log("📝 Resume selection modal detected.");

    // Select the first radio (usually most recent resume)
    const resumeRadio = await page.$('input[type="radio"]');
    if (resumeRadio) {
      await resumeRadio.check();
      console.log("✅ Resume selected.");
    }

    // Click the "Next" button to proceed
    const nextButton = await page.$('button:has-text("Next")');
    if (nextButton) {
      await nextButton.click();
      console.log("➡️ Clicked Next to proceed with application.");
      await page.waitForTimeout(3000);
    }
  }
} catch (err) {
  console.warn("⚠️ Resume modal handler failed:", err.message);
}


    //Handles all Templates Questions
    // await answerQuestions(page);
    // await handleNextOrReview(page) // recursive answers questions until it reaches review
    try {
      // Wait a bit before handling questions
      await page.waitForTimeout(3000);
    
      console.log("📋 Answering form questions...");
      await answerQuestions(page);
    
      console.log("🧭 Proceeding to review/submit stage...");
      await handleNextOrReview(page); // Make sure this runs no matter what
    } catch (error) {
      console.error("❌ Error while handling form/review:", error.message);
    }
    

  }// Move to the next page if available
  currentPage++;
  



  try {
    const nextPageButton = await page.$(`button[aria-label="Page ${currentPage}"]`);
    if (nextPageButton) {
        await nextPageButton.click({ timeout: 5000 });
        console.log(`Navigated to page ${currentPage}`);
    } else {
        console.log('✅ No more pages available. Exiting...');
        break;
    }
} catch (err) {
    console.warn('⚠️ First click failed. Attempting to dismiss overlay...');
    try {
        await page.keyboard.press('Escape'); // Dismiss popup
        await page.waitForTimeout(2000);

        const nextPageButton = await page.$(`button[aria-label="Page ${currentPage}"]`);
        if (nextPageButton) {
            await nextPageButton.click({ timeout: 5000 });
            console.log(`Navigated to page ${currentPage} after dismissing overlay`);
        } else {
            console.log('✅ No more pages available after dismiss. Exiting...');
            break;
        }
    } catch (clickErr) {
        console.error('❌ Final catch: Still blocked. Exiting cleanly...');
        break;
    }
}

}
}catch (error) {
  console.error("Script error:", error);
} finally {
  await browser.close();
}
})();

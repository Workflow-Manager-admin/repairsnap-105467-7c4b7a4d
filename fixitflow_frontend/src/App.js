import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * .env/YouTube API Key Loading Diagnostics
 * This code block at the top will print a warning in the development console (and during production build) if
 * the environment variable is not set OR is set at an incorrect location.
 * 
 * For Create React App (CRA) and react-scripts:
 * - .env must be in the root of the React app (fixitflow_frontend/.env)
 * - Keys must be prefixed with REACT_APP_ (e.g., REACT_APP_YOUTUBE_API_KEY)
 * - After adding/modifying .env, you MUST fully restart the dev or build script.
 */
if (
  !process.env.REACT_APP_YOUTUBE_API_KEY ||
  process.env.REACT_APP_YOUTUBE_API_KEY === "YOUR_API_KEY_HERE"
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[FixItFlow] WARNING: REACT_APP_YOUTUBE_API_KEY is missing (value:",
    process.env.REACT_APP_YOUTUBE_API_KEY,
    ").\n" +
    "Please create a `.env` file at the *fixitflow_frontend* directory root and add:\n" +
    "REACT_APP_YOUTUBE_API_KEY=YOUR_YOUTUBE_DATA_API_KEY\n" +
    "Do NOT place .env in the parent repo root! After any change, restart `npm start`."
  );
}

/**
 * Color palette for theme
 */
const COLORS = {
  primary: "#1e88e5",
  accent: "#fbc02d",
  secondary: "#43a047",
  lightBg: "#fafbfc",
  lightHeader: "#f5f7f9",
};

const IFIXIT_API = "https://www.ifixit.com/api/2.0";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

/**
 * IMPORTANT SETUP:
 * You must provide a .env file at the project root with:
 *   REACT_APP_YOUTUBE_API_KEY=YOUR_YOUTUBE_DATA_API_KEY
 * Otherwise, video tutorial search will not work (API error / missing key)!
 */

/**
 * PUBLIC_INTERFACE
 * Expanded App for FixItFlow: Allows image upload, object recognition,
 * user problem description, fetches and displays iFixit repair step guides
 * interactively and relevant YouTube videos.
 */
function App() {
  const [image, setImage] = useState(null);
  const [recognizedObjects, setRecognizedObjects] = useState([]);
  const [objectRecognitionService, setObjectRecognitionService] = useState("tfjs");
  const [objectRecognitionLoading, setObjectRecognitionLoading] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);

  const [guides, setGuides] = useState([]);
  const [videos, setVideos] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // New: User problem description
  const [userProblem, setUserProblem] = useState("");
  const [problemError, setProblemError] = useState(null);

  const [theme, setTheme] = useState("light");

  // Demo: Insert your Google Cloud Vision API key here if available
  const GOOGLE_API_KEY = ""; // Optional - leave blank to skip vision API

  // Load TensorFlow.js and MobileNet only when needed
  const tfRef = useRef(null);
  const mobilenetRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle image upload
  // PUBLIC_INTERFACE
  const onImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setRecognitionError(null);
    setRecognizedObjects([]);
    setGuides([]);
    setVideos([]);
    setKeyword("");
    setUserProblem(""); // also clear problem desc when new photo
    await runObjectRecognition(file);
  };

  // PUBLIC_INTERFACE
  const runObjectRecognition = async (file) => {
    setObjectRecognitionLoading(true);
    setRecognitionError(null);
    let labels = [];
    try {
      if (objectRecognitionService === "tfjs") {
        labels = await recognizeImageWithTFJS(file);
      } else {
        if (GOOGLE_API_KEY) {
          labels = await recognizeImageWithGoogleVision(file, GOOGLE_API_KEY);
        } else {
          setRecognitionError("No Google API key. Switch to TensorFlow.js.");
        }
      }
      setRecognizedObjects(labels);
      if (labels.length) {
        setKeyword(labels[0]);
        await fetchGuidesAndVideos(labels[0]);
      }
    } catch (err) {
      setRecognitionError("Recognition failed: " + err.message);
    }
    setObjectRecognitionLoading(false);
  };

  /**
   * TensorFlow.js MobileNet in-browser recognition.
   * Returns list of labels sorted by predicted prob.
   */
  // PUBLIC_INTERFACE
  async function recognizeImageWithTFJS(file) {
    setRecognitionError(null);
    if (!tfRef.current || !mobilenetRef.current) {
      // Dynamically import tf and MobileNet
      const [tf, mobilenet] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/mobilenet"),
      ]);
      tfRef.current = tf;
      mobilenetRef.current = mobilenet;
    }
    const tf = tfRef.current;
    const mobilenet = mobilenetRef.current;
    const model = await mobilenet.load();

    // Create an image element
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => (img.onload = resolve));
    // Run the model
    const predictions = await model.classify(img, 4);
    if (predictions.length === 0) throw new Error("No objects detected.");
    // Return distinct, 'clean' keywords (remove probability % and lower-case)
    return predictions.map((pred) =>
      pred.className
        .split(",")[0]
        .trim()
        .toLowerCase()
    );
  }

  /**
   * Google Cloud Vision API recognition.
   * Returns list of description labels sorted by score.
   */
  // PUBLIC_INTERFACE
  async function recognizeImageWithGoogleVision(file, apiKey) {
    setRecognitionError(null);
    const fileBase64 = await convertFileToBase64(file);
    // Vision API expects base64 without prefix
    const imageBase64 = fileBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    const body = {
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: "LABEL_DETECTION", maxResults: 5 }],
        },
      ],
    };
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (!data.responses || !data.responses[0] || !data.responses[0].labelAnnotations)
      throw new Error("No objects detected.");
    // Return lower-case descriptions
    return data.responses[0].labelAnnotations.map((la) => la.description.toLowerCase());
  }

  // Convert file to base64
  function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Fetch iFixit guides and YouTube videos, inferring search better from
   * both recognized label and user problem text.
   */
  /**
   * Fetch iFixit guides and YouTube videos, with enhanced API diagnostic and result handling.
   */
  async function fetchGuidesAndVideos(mainKeyword, problemText = "") {
    setSearchLoading(true);
    setGuides([]);
    setVideos([]);
    let searchUsed = mainKeyword;
    let errorMessage = null;
    try {
      // Step 1: Compose a smarter search query.
      let query = mainKeyword;
      if (problemText && problemText.length > 2) {
        query = `${mainKeyword} ${problemText}`.trim();
        searchUsed = query;
      }

      // iFixit: Find relevant guides robustly
      let guidesUrl = `${IFIXIT_API}/search/${encodeURIComponent(query)}`;
      let allGuides = [];
      let guidesJson = {};

      try {
        let guidesResp = await fetch(guidesUrl);
        guidesJson = await guidesResp.json();

        if (Array.isArray(guidesJson.results)) {
          for (let item of guidesJson.results) {
            // Both shape: individual guide or a device/group with guides
            if (item.guideid) allGuides.push(item);
            if (item.guides && Array.isArray(item.guides))
              allGuides.push(...item.guides.filter(g => g.guideid));
          }
        }
        // Some fallback: sometimes guides are top-level
        if (allGuides.length === 0 && Array.isArray(guidesJson.guides)) {
          allGuides = guidesJson.guides.filter(g => g.guideid);
        }
        // Sometimes single guide present as .guide
        if (allGuides.length === 0 && guidesJson.guide && guidesJson.guide.guideid) {
          allGuides.push(guidesJson.guide);
        }
        // Deduplicate by guideid
        allGuides = Object.values(allGuides.reduce((acc, g) => {
          if (g.guideid) acc[g.guideid] = g;
          return acc;
        }, {}));
        setGuides(allGuides.slice(0, 4));
      } catch (ifixErr) {
        errorMessage = "iFixit API error: " + (ifixErr.message || "Could not fetch guides.");
        setGuides([]);
      }

      // ---------- YouTube Video Tutorials Search ----------
      // Must have a valid API key
      const YT_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
      if (!YT_API_KEY || YT_API_KEY === "YOUR_API_KEY_HERE") {
        setVideos([]);
        if (errorMessage)
          errorMessage += " — ";
        errorMessage = (errorMessage || "") + "YouTube API key is missing. Set REACT_APP_YOUTUBE_API_KEY in an .env file.";
      } else {
        const videoQ = encodeURIComponent(query + " repair tutorial OR fix guide");
        let ytReq = `${YOUTUBE_SEARCH_URL}?key=${YT_API_KEY}&type=video&part=snippet&maxResults=4&q=${videoQ}`;
        let ytRes, ytData;
        try {
          ytRes = await fetch(ytReq);
          ytData = await ytRes.json();
          if (!ytRes.ok || ytData.error) {
            throw new Error(
              (ytData.error && ytData.error.message) ||
              `YouTube API error (HTTP ${ytRes.status})`
            );
          }
          setVideos(
            (ytData.items || []).map((vid) => ({
              id: vid.id.videoId,
              title: vid.snippet.title,
              thumb: vid.snippet.thumbnails.medium.url,
              channel: vid.snippet.channelTitle,
            }))
          );
        } catch (ytErr) {
          setVideos([]);
          if (errorMessage)
            errorMessage += " — ";
          errorMessage = (errorMessage || "") + "YouTube error: " + ytErr.message;
        }
      }

      if (
        (!allGuides || allGuides.length === 0) &&
        (!YT_API_KEY || !errorMessage) &&
        (!videos || videos.length === 0)
      ) {
        errorMessage =
          errorMessage ||
          "No matching repair guides or videos found for this query. Try a different keyword or description.";
      }
    } catch (err) {
      errorMessage =
        (errorMessage ? errorMessage + " — " : "") + "Fetching resources failed: " + err.message;
      setGuides([]);
      setVideos([]);
    }

    if (errorMessage) {
      setRecognitionError(errorMessage);
    } else {
      setRecognitionError(null);
    }
    setSearchLoading(false);
  }

  // PUBLIC_INTERFACE
  // Submission when user provides either a keyword or updates the problem desc.
  const handleKeywordSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setRecognizedObjects([keyword.trim()]);
    await fetchGuidesAndVideos(keyword.trim(), userProblem);
  };

  // PUBLIC_INTERFACE
  // Submission when the problem description field is used directly.
  const handleProblemDescSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setProblemError("Please provide a recognized object or keyword.");
      return;
    }
    setProblemError(null);
    await fetchGuidesAndVideos(keyword.trim(), userProblem);
  };

  // PUBLIC_INTERFACE
  const handleRecognizerToggle = () => {
    if (objectRecognitionService === "tfjs") {
      setObjectRecognitionService("vision");
    } else {
      setObjectRecognitionService("tfjs");
    }
  };

  // PUBLIC_INTERFACE
  const handleThemeToggle = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  return (
    <div style={{ background: COLORS.lightBg, minHeight: "100vh" }}>
      <Header
        onThemeToggle={handleThemeToggle}
        theme={theme}
        primaryColor={COLORS.primary}
      />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
        <section style={cardSectionStyle}>
          <UploadCard
            image={image}
            onImageChange={onImageChange}
            recogLoading={objectRecognitionLoading}
            recognizer={objectRecognitionService}
            onRecognizerToggle={handleRecognizerToggle}
            recogError={recognitionError}
            keywordValue={keyword}
            setKeyword={setKeyword}
            onKeywordSubmit={handleKeywordSubmit}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ResultCard
              recognizedObjects={recognizedObjects}
              recogLoading={objectRecognitionLoading}
              recogError={recognitionError}
              primaryColor={COLORS.primary}
              accentColor={COLORS.accent}
              keyword={keyword}
              onKeywordSubmit={handleKeywordSubmit}
              setKeyword={setKeyword}
            />
            {/* User-provided problem description */}
            <ProblemDescCard
              userProblem={userProblem}
              setUserProblem={setUserProblem}
              onSubmit={handleProblemDescSubmit}
              searchLoading={searchLoading}
              problemError={problemError}
            />
          </div>
        </section>
        <section style={{ marginTop: 36 }}>
          <div style={sectionHeaderStyle(COLORS.secondary)}>
            <span>🔧 Step-by-step Repair Guides</span>
          </div>
          <GuideStepsAccordion guides={guides} accentColor={COLORS.accent} recogError={recognitionError} />
        </section>
        <section style={{ marginTop: 36 }}>
          <div style={sectionHeaderStyle(COLORS.primary)}>
            <span>▶️ DIY Video Tutorials</span>
          </div>
          <VideoGrid videos={videos} recogError={recognitionError} />
        </section>
        <footer style={{ margin: "4rem auto 2rem", color: "#444", textAlign: "center" }}>
          <small>
            Powered by TensorFlow.js, Google Vision, iFixit, and YouTube &mdash;{" "}
            <a href="https://github.com/iFixit/iFixit-API" target="_blank" rel="noopener noreferrer">
              API Docs
            </a>
          </small>
        </footer>
      </main>
    </div>
  );
}

const cardSectionStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 32,
  alignItems: "flex-start",
  marginBottom: 36,
};
const sectionHeaderStyle = (color) => ({
  fontSize: 22,
  fontWeight: 700,
  color: color,
  margin: "0 0 16px 0",
  letterSpacing: 0.1,
});

// ------------------ Header ---------------------
// PUBLIC_INTERFACE
function Header({ onThemeToggle, theme, primaryColor }) {
  return (
    <header
      style={{
        width: "100%",
        background: "#fff",
        borderBottom: "2px solid #e9ecef",
        display: "flex",
        alignItems: "center",
        padding: "18px 32px",
        justifyContent: "space-between",
        marginBottom: 36,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            background: primaryColor,
            borderRadius: "12px",
            color: "#fff",
            fontWeight: 700,
            fontSize: 20,
            display: "inline-block",
            padding: "6px 16px",
            letterSpacing: 1.2,
          }}
        >
          FixItFlow
        </span>
        <span style={{ color: "#444", marginLeft: 8, fontSize: 16 }}>
          Snap. Recognize. Repair!
        </span>
      </div>
      <button
        className="theme-toggle"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        onClick={onThemeToggle}
        style={{ background: primaryColor, color: "#fff" }}
      >
        {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
      </button>
    </header>
  );
}

// ------------- Upload Card ----------------------
// PUBLIC_INTERFACE
function UploadCard({
  image,
  onImageChange,
  recogLoading,
  recognizer,
  onRecognizerToggle,
  recogError,
  keywordValue,
  setKeyword,
  onKeywordSubmit,
}) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontWeight: 700, fontSize: 21 }}>1. Upload a photo</h2>
      <label
        htmlFor="file-upload"
        style={{
          display: "block",
          border: "2px dashed #ddd",
          borderRadius: 16,
          padding: "30px 10px",
          margin: "24px 0 12px 0",
          background: "#f7f8fa",
          color: "#999",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        <span role="img" aria-label="camera">
          📷
        </span>{" "}
        <span>
          {image ? "Change photo" : "Drag & drop, or click to select"}
        </span>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          disabled={recogLoading}
          onChange={onImageChange}
        />
      </label>
      {image && (
        <img
          src={image}
          alt="uploaded"
          style={{
            margin: "12px auto",
            display: "block",
            maxHeight: 130,
            objectFit: "contain",
            borderRadius: 8,
            border: "1px solid #efefef",
          }}
        />
      )}
      <div style={{ marginTop: 14, fontSize: 13 }}>
        Using:{" "}
        <span style={{ color: "#1e88e5" }}>
          {recognizer === "vision" ? "Google Vision API" : "TensorFlow.js (browser)"}
        </span>
        <button
          onClick={onRecognizerToggle}
          style={{
            marginLeft: 16,
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Switch
        </button>
      </div>
      {/* Keyword manual input fallback */}
      <form style={{ marginTop: 16 }} onSubmit={onKeywordSubmit}>
        <label htmlFor="manual-keyword" style={{ fontSize: 15, fontWeight: 600 }}>
          ...Or enter what you want to repair:
        </label>
        <input
          id="manual-keyword"
          value={keywordValue}
          type="text"
          style={{
            width: "93%",
            padding: "9px 12px",
            margin: "8px 0 0 0",
            fontSize: 15,
            border: "1.5px solid #ccc",
            borderRadius: 7,
          }}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={recogLoading}
          placeholder="e.g., toaster, iPhone X, bicycle, etc"
        />
        <button
          type="submit"
          style={{
            display: "inline-block",
            marginLeft: 6,
            background: "#43a047",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            padding: "9px 24px",
            fontSize: 15,
            cursor: "pointer",
          }}
          disabled={!keywordValue}
        >
          Go
        </button>
      </form>
      {recogError && (
        <div
          style={{
            color: "#e53935",
            background: "#fff8ea",
            border: "1px solid #ffe0b2",
            marginTop: 14,
            padding: "8px 14px",
            borderRadius: 7,
            fontSize: 14,
            maxWidth: 340,
          }}
        >
          {recogError}
        </div>
      )}
      {recogLoading && (
        <div style={{ marginTop: 8, color: "#43a047", fontWeight: 600 }}>
          Processing photo...
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  borderRadius: 18,
  border: "2px solid #f4f4f4",
  boxShadow: "0 2px 8px #f6f6f6",
  padding: "32px 22px",
  minHeight: 380,
  maxWidth: 390,
  width: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
};

/**
 * PUBLIC_INTERFACE
 * Step 2: Recognition Results Card (context only).
 */
function ResultCard({
  recognizedObjects,
  recogLoading,
  recogError,
  primaryColor,
  accentColor,
  keyword,
  setKeyword,
}) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontWeight: 700, fontSize: 21 }}>2. Recognition Results</h2>
      {recogLoading && (
        <div style={{ color: accentColor, fontWeight: 500, marginTop: 30 }}>
          Detecting objects...
        </div>
      )}
      {!recogLoading && recognizedObjects.length === 0 && (
        <div style={{ color: "#888", maxWidth: 320, margin: "30px auto 0" }}>
          <span>
            Upload an image or enter a keyword to get repair guidance.
          </span>
        </div>
      )}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 22 }}>
        {recognizedObjects.map((obj, idx) => (
          <li
            key={obj + idx}
            style={{
              background: "#f5fafc",
              marginBottom: 10,
              borderRadius: 8,
              padding: "10px 16px",
              color: primaryColor,
              fontWeight: 600,
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 19 }}>🔍</span> {obj}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 22, fontSize: 14, color: "#333" }}>
        <b>Top match:</b>{" "}
        <span style={{ color: accentColor, fontSize: 17, fontWeight: 700 }}>
          {keyword || "N/A"}
        </span>
        <br />
        <span style={{ fontSize: 14, color: "#888" }}>
          Results and repair guides are tailored to this.
        </span>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Lets the user input a problem/description to improve diagnosis and the
 * specificity of repair guides.
 */
function ProblemDescCard({ userProblem, setUserProblem, onSubmit, searchLoading, problemError }) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "#fff",
        borderRadius: 18,
        border: "2px solid #f4f4f4",
        boxShadow: "0 2px 8px #f6f6f6",
        padding: "28px 22px 18px 22px",
        minHeight: 110,
        maxWidth: 390,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      <label htmlFor="problem-desc" style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 1 }}>
        3. Briefly describe what's wrong (optional):
      </label>
      <textarea
        id="problem-desc"
        value={userProblem}
        placeholder="e.g., Toaster won't heat up, screen cracked, bike chain keeps slipping..."
        onChange={(e) => setUserProblem(e.target.value)}
        rows={2}
        maxLength={240}
        style={{
          width: "100%",
          padding: "8px 11px",
          fontSize: 15,
          border: "1.5px solid #ccc",
          borderRadius: 7,
          resize: "none",
        }}
        disabled={searchLoading}
        spellCheck
      />
      <button
        type="submit"
        disabled={searchLoading || !userProblem.trim()}
        style={{
          marginTop: 8,
          alignSelf: "flex-start",
          background: "#fbc02d",
          color: "#222",
          fontWeight: 700,
          border: "none",
          borderRadius: 8,
          padding: "8px 21px",
          fontSize: 15,
          cursor: searchLoading ? "wait" : "pointer",
          opacity: userProblem.trim() ? 1 : 0.65,
        }}
      >
        {searchLoading ? "Searching..." : "Improve Results"}
      </button>
      {problemError && (
        <span style={{ color: "#e53935", fontSize: 15, marginTop: 2 }}>{problemError}</span>
      )}
      <span style={{ color: "#888", fontSize: 13, marginTop: 7 }}>
        Use your own words to explain the issue, symptoms, or what you tried. (Optional, but helps pinpoint the right fix!)
      </span>
    </form>
  );
}

/**
 * PUBLIC_INTERFACE
 * Improved interactive accordion for Step-by-step Repair Guides.
 * Each guide shows its steps on click (fetch from iFixit if needed).
 */
function GuideStepsAccordion({ guides, accentColor, recogError }) {
  const [expanded, setExpanded] = useState(null);
  const [stepsData, setStepsData] = useState({});
  const [loadingStepGuide, setLoadingStepGuide] = useState(false);
  const [fetchedGuideIds, setFetchedGuideIds] = useState({});

  // Fetch step-by-step guide details from iFixit API on demand.
  const fetchGuideSteps = async (guide) => {
    if (stepsData[guide.guideid] || fetchedGuideIds[guide.guideid]) return;
    setLoadingStepGuide(true);
    try {
      const resp = await fetch(`${IFIXIT_API}/guides/${guide.guideid}`);
      const json = await resp.json();
      setStepsData((s) => ({ ...s, [guide.guideid]: json }));
      setFetchedGuideIds((o) => ({ ...o, [guide.guideid]: true }));
    } catch (err) {
      setStepsData((s) => ({
        ...s,
        [guide.guideid]: { error: "Could not fetch step details." },
      }));
    }
    setLoadingStepGuide(false);
  };

  // UI: If none, show API error if present, else default.
  if (!guides?.length) {
    return (
      <div style={{ color: "#b53c00", minHeight: 70, fontWeight: 500 }}>
        {recogError ? recogError : <span style={{ color: "#bbb" }}>No guides found.</span>}
      </div>
    );
  }
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 22,
      minWidth: 320,
      maxWidth: 850,
      margin: "0 auto"
    }}>
      {guides.map((guide, idx) => (
        <div
          key={guide.guideid}
          style={{
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 2px 9px #f5f5f7",
            border: "1.5px solid #e3eefc",
            padding: "0 0 0 0",
            marginBottom: 6
          }}
        >
          <button
            onClick={() => {
              setExpanded((current) => (current === guide.guideid ? null : guide.guideid));
              if (!stepsData[guide.guideid]) fetchGuideSteps(guide);
            }}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              padding: "17px 22px 16px 22px",
              fontWeight: 700,
              fontSize: 17.5,
              textAlign: "left",
              color: "#1e439a",
              cursor: "pointer",
              outline: "none",
            }}
            aria-expanded={expanded === guide.guideid}
            aria-controls={`gsteps-${guide.guideid}`}
          >
            {expanded === guide.guideid ? "▼" : "▶"} {guide.title}
            <span
              style={{
                marginLeft: 17,
                background: accentColor,
                color: "#fff",
                borderRadius: 7,
                padding: "2px 9px",
                fontSize: 13.5,
                fontWeight: 700,
                verticalAlign: "middle"
              }}
            >
              {guide.steps ? `${guide.steps} steps` : "DIY"}
            </span>
            {guide.time_required && (
              <span style={{ color: "#555", marginLeft: 7, fontWeight: 400 }}>
                ⏱ {guide.time_required}
              </span>
            )}
          </button>
          <div
            id={`gsteps-${guide.guideid}`}
            style={{
              display: expanded === guide.guideid ? "block" : "none",
              padding: "0 22px 19px 30px",
              borderTop: "1.5px solid #f7e5c1",
              background: "#f9fafb",
            }}
          >
            {/* Show guide detail */}
            <GuideStepDetails
              guide={guide}
              stepsDetail={stepsData[guide.guideid]}
              loading={loadingStepGuide && expanded === guide.guideid}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Step-by-step instructions per guide, with each step as a sub-card.
 */
function GuideStepDetails({ guide, stepsDetail, loading }) {
  if (loading) return <div>Loading steps…</div>;
  if (stepsDetail?.error) return <div style={{ color:"#b53c00" }}>{stepsDetail.error}</div>;
  if (!stepsDetail || !stepsDetail.steps) {
    return (
      <div style={{ color: "#888", fontSize: 15 }}>
        No step-by-step details available for this guide.
        <br />
        <a href={`https://www.ifixit.com/Guide/${guide.guideid}`} rel="noopener noreferrer" target="_blank">View full guide on iFixit &rarr;</a>
      </div>
    );
  }
  return (
    <ol style={{
      listStyle: "decimal inside",
      padding: 0,
      margin: "14px 0 0 0",
      fontSize: 15.5
    }}>
      {stepsDetail.steps.map((step, idx) => (
        <li key={idx} style={{
          background: "#fff",
          margin: "0 0 14px 0",
          padding: "15px 17px 12px 13px",
          border: "1px solid #f7e2bb",
          borderLeft: "5px solid #fbc02d",
          borderRadius: 7,
          boxShadow: "0 1px 6px #fbeee1",
          color: "#222",
          position: "relative"
        }}>
          <b style={{fontSize:16}}>Step {step.ordinal || idx + 1}:</b> &nbsp;
          {step.title && <span style={{fontWeight:700}}>{step.title}. </span>}
          <span dangerouslySetInnerHTML={{ __html: step.text_raw || step.text_html || "" }} />
          {/* Images if any */}
          {Array.isArray(step.images) && step.images[0] &&
            <div style={{marginTop:7}}>
              {step.images.slice(0,2).map((img, i) =>
                <img
                  src={img.standard || img.thumbnail}
                  key={img.id || i}
                  alt={step.title || ""}
                  style={{
                    maxWidth: "96%",
                    height: 94,
                    objectFit: "cover",
                    borderRadius: 5,
                    marginRight: 12,
                    border: "1.5px solid #fbc02d33"
                  }}
                />
              )}
            </div>
          }
        </li>
      ))}
    </ol>
  );
}

// ----------- Videos Grid ---------------------
// PUBLIC_INTERFACE
function VideoGrid({ videos, recogError }) {
  if (!videos?.length)
    return (
      <div style={{ color: recogError ? "#b53c00" : "#bbb", minHeight: 70, fontWeight: 500 }}>
        {recogError ? recogError : "No video tutorials found."}
      </div>
    );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 22,
      }}
    >
      {videos.map((v, idx) => (
        <VideoCard video={v} key={v.id + idx} />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function VideoCard({ video }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 7px #f5f5f7",
        border: "1.5px solid #f6f9fa",
        padding: 19,
        minHeight: 190,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <a
        href={`https://youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#1e88e5",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 16.5,
        }}
      >
        <img
          src={video.thumb}
          alt={video.title}
          style={{
            width: "100%",
            maxWidth: 294,
            borderRadius: 8,
            marginBottom: 10,
            boxShadow: "0 1px 4px #eaf0fa",
          }}
        />
        {video.title}
      </a>
      <span
        style={{
          fontSize: 13,
          color: "#888",
          margin: "3px 0 0 1px",
          fontWeight: 500,
        }}
      >
        by {video.channel}
      </span>
    </div>
  );
}

export default App;

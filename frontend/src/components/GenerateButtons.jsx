import API from "../api/api";


export default function GenerateButtons({ data, setOutput }) {
const generate = async () => {
const summary = await API.post("/generate-summary", data);
const flashcards = await API.post("/generate-flashcards", data);
const mindmap = await API.post("/generate-mindmap", data);


setOutput({
summary: summary.data.summary,
flashcards: flashcards.data.flashcards,
mindmap: mindmap.data.mindmap,
});
};


return <button onClick={generate}>Generate Content</button>;
}
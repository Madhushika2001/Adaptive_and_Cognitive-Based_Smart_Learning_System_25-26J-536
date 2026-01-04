export default function OutputDisplay({ output }) {
return (
<div>
<h3>Summary</h3>
<p>{output.summary}</p>


<h3>Flashcards</h3>
<pre>{JSON.stringify(output.flashcards, null, 2)}</pre>


<h3>Mind Map</h3>
<pre>{JSON.stringify(output.mindmap, null, 2)}</pre>
</div>
);
}
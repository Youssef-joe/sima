import os, glob, re, json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RAGEngine:
    def __init__(self, corpus_dir: str):
        self.corpus_dir = corpus_dir
        os.makedirs(self.corpus_dir, exist_ok=True)
        self.documents = []
        self.doc_ids = []
        self.vectorizer = None
        self.matrix = None
        self.build_index()

    def build_index(self):
        paths = sorted(glob.glob(os.path.join(self.corpus_dir, "*.md")))
        self.documents = [open(p, "r", encoding="utf-8").read() for p in paths]
        self.doc_ids = [os.path.basename(p) for p in paths]
        if self.documents:
            self.vectorizer = TfidfVectorizer(stop_words='english')
            self.matrix = self.vectorizer.fit_transform(self.documents)
        else:
            self.vectorizer = None
            self.matrix = None

    def retrieve(self, query: str, topk: int = 3):
        if not self.matrix or not self.vectorizer:
            return []
        qv = self.vectorizer.transform([query])
        sims = cosine_similarity(qv, self.matrix).ravel()
        top_idx = sims.argsort()[::-1][:topk]
        out = []
        for i in top_idx:
            out.append({"doc": self.doc_ids[i], "score": float(sims[i]), "excerpt": self.documents[i][:600]})
        return out

    def generate_answer(self, message: str, ctx, region_hint=None):
        # Very simple template-based "generator" (no LLM dependency)
        bullets = []
        for c in ctx:
            bullets.append(f"- From {c['doc']}: {c['excerpt'][:180].strip()}...")
        intro = f"سأعطيك إجابة مختصرة مستندة إلى مراجع الهوية السعودية{(' — نطاق: '+region_hint) if region_hint else ''}."
        if not bullets:
            return intro + "\n\nلم أجد مراجع في المستودع. اقترح تزويدي بالنطاق (نجدي، حجازي، عسير...)."
        return intro + "\n\n" + "\n".join(bullets) + "\n\nتوصية: عدّل نسب الفتحات ومواد الواجهة وفق دليل الهوية للنطاق المذكور، ثم أعد التقييم."

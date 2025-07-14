from langchain.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.text_splitter import RecursiveCharacterTextSplitter

import pathlib, functools
from dotenv import load_dotenv

load_dotenv()


_FAQ_PATH = pathlib.Path(__file__).parent / "faq.txt"

@functools.cache
def _build_chain():
    raw = _FAQ_PATH.read_text(encoding="utf-8")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512, chunk_overlap=50
    )                     
    docs = splitter.create_documents([raw])


    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectorstore = FAISS.load_local("memoryStore/faiss", embeddings, allow_dangerous_deserialization=True)
    retriever = vectorstore.as_retriever()
    llm = GoogleGenerativeAI(model="gemini-2.5-flash-preview")

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True
    )
    return qa_chain
 

def answer(question: str) -> str:
    chain = _build_chain()
    result = chain.invoke({"query": question})
    return result["result"]

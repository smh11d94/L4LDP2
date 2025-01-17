export default function ExamLayout({ children }) {
    return (
      <html lang="en">
      <head>
      <title>Quiz</title>
      </head>
      <body>
      <div style={{
        display: 'block',
        alignItems: 'normal',
        justifyContent: 'normal',
        minHeight: '100vh',
        margin: 0,
      }}>
        {children}
      </div>
      </body>
      </html>
    );
  }
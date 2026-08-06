import Image from "next/image";
import SignInForm from "@/components/auth/LoginForm";

const SignInPage = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        .salon-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #fff7ed;
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }

        .blob-one {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(251,146,60,0.15) 0%,
            transparent 70%
          );
          top: -200px;
          right: -150px;
        }

        .blob-two {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(244,114,182,0.12) 0%,
            transparent 70%
          );
          bottom: -150px;
          left: -100px;
        }

        .salon-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 24px;
          padding: 40px 36px 36px;
          position: relative;
          z-index: 1;

          box-shadow:
            0 0 0 1px rgba(251,146,60,0.08),
            0 8px 32px rgba(251,146,60,0.12),
            0 32px 64px rgba(0,0,0,0.06);

          animation: rise .45s ease both;
        }

        @keyframes rise {
          from {
            opacity:0;
            transform:translateY(20px);
          }

          to {
            opacity:1;
            transform:translateY(0);
          }
        }

        .salon-header {
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
          margin-bottom:32px;
        }

        .logo-box {
          width:72px;
          height:72px;
          border-radius:18px;
          background:linear-gradient(
            135deg,
            #ffedd5,
            #fed7aa
          );
          display:flex;
          align-items:center;
          justify-content:center;
          margin-bottom:16px;
        }

        .salon-title {
          font-size:22px;
          font-weight:700;
          color:#1c1917;
        }

        .salon-subtitle {
          margin-top:5px;
          font-size:13px;
          color:#a8a29e;
        }

        .divider {
          width:40px;
          height:2px;
          background:linear-gradient(
            90deg,
            #f97316,
            #ec4899
          );
          border-radius:5px;
          margin:14px auto;
        }

        .footer {
          margin-top:28px;
          padding-top:20px;
          border-top:1px solid #f5f5f4;
          text-align:center;
        }

        .footer-text {
          font-size:11px;
          color:#a8a29e;
        }

        @media(max-width:480px){
          .salon-card{
            padding:32px 24px;
          }
        }
      `}</style>

      <div className="salon-root">
        <div className="blob-one" />
        <div className="blob-two" />

        <div className="salon-card">
          <div className="salon-header">
            <div className="logo-box">
              <Image
                src="/logo.png"
                alt="Salon Logo"
                width={52}
                height={52}
                className="object-contain"
              />
            </div>

            <div className="salon-title">Welcome Back</div>

            <div className="divider" />

            <div className="salon-subtitle">Sign in to manage your salon</div>
          </div>

          <SignInForm />

          <div className="footer">
            <p className="footer-text">
              <strong>Beauty Salon Management System</strong>
              <br />© {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignInPage;

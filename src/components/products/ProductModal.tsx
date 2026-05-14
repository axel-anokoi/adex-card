// ProductModal.tsx - Composant modal avec effet glitch et ajout au panier amélioré
import { useEffect, useState } from 'react';

interface ProductModalProps {
  product: {
    id: string;
    name: string;
    eur: number;
    tag: string;
    image: string;
    cat: string;
  } | null;
  onClose: () => void;
  onAddToCart: (product: any) => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const [glitchText, setGlitchText] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(product?.eur || 0);
  const [added, setAdded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    // Glitch effect interval
    const interval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 150);
    }, 3000);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
      clearInterval(interval);
    };
  }, [onClose]);

  if (!product) return null;

  const handleAdd = async () => {
    setIsLoading(true);
    
    // Simulate API call or processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAdded(true);
    setShowSuccess(true);
    
    onAddToCart({ 
      ...product, 
      eur: selectedAmount,
      quantity: quantity,
      total: selectedAmount * quantity
    });
    
    // Reset states after animation
    setTimeout(() => {
      setAdded(false);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 800);
    }, 1500);
    
    setIsLoading(false);
  };

  const amounts = product.cat === 'psn' ? [10, 20, 50] :
                  product.cat === 'xbox' ? [10, 25, 50] :
                  product.cat === 'nintendo' ? [10, 20, 35] : [5, 10, 25];

// Get category color based on theme (using CSS variables)
  const getCategoryColor = () => {
    const isDark = document.documentElement.classList.contains('dark');
    switch(product.cat) {
      case 'psn': return isDark ? 'var(--cyan)' : 'var(--cyan)';
      case 'xbox': return isDark ? 'var(--green)' : 'var(--green)';
      case 'nintendo': return isDark ? 'var(--pink)' : 'var(--pink)';
      default: return isDark ? 'var(--text-muted)' : 'var(--text-muted)';
    }
  };

  // Get category gradient based on theme (using CSS variables)
  const getCategoryGradient = () => {
    const isDark = document.documentElement.classList.contains('dark');
    switch(product.cat) {
      case 'psn': return isDark 
        ? 'linear-gradient(135deg, var(--cyan), var(--violet))'
        : 'linear-gradient(135deg, var(--cyan), #0b5f58)';
      case 'xbox': return isDark 
        ? 'linear-gradient(135deg, var(--green), #00aa5e)'
        : 'linear-gradient(135deg, var(--green), #047857)';
      case 'nintendo': return isDark 
        ? 'linear-gradient(135deg, var(--pink), #cc2060)'
        : 'linear-gradient(135deg, var(--pink), #be185d)';
      default: return isDark 
        ? 'linear-gradient(135deg, var(--text-muted), var(--text-faint))'
        : 'linear-gradient(135deg, #64748b, #475569)';
    }
  };

  const toFCFA = (eur: number) => (eur * 655).toLocaleString("fr-FR");

  const totalPrice = selectedAmount * quantity;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose}>
        {/* Modal Container */}
        <div className={`modal-container ${showSuccess ? 'success-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
          {/* Glitch Border Effect */}
          <div className="modal-glitch-border" />
          <div className="modal-glitch-border glitch-delay-1" />
          <div className="modal-glitch-border glitch-delay-2" />
          
          {/* Close Button */}
          <button className="modal-close" onClick={onClose}>
            <span className="close-icon">✕</span>
          </button>
          
          {/* Success Animation Overlay */}
          {showSuccess && (
            <div className="success-overlay">
              <div className="success-animation">
                <div className="success-checkmark">
                  <div className="check-icon">✓</div>
                </div>
                <div className="success-sparkles">
                  <span className="sparkle">✨</span>
                  <span className="sparkle">⚡</span>
                  <span className="sparkle">💫</span>
                </div>
              </div>
              <div className="success-message">
                <h3>Ajouté au panier !</h3>
                <p>{quantity}x {product.name} - {selectedAmount}€</p>
                <p className="success-total">Total: {toFCFA(totalPrice)} FCFA</p>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className={`modal-content ${showSuccess ? 'blur-content' : ''}`}>
            {/* Product Media */}
            <div className="modal-media">
              <div className="modal-media-glow" />
              <span className="modal-product-icon">{product.image}</span>
              <div className="modal-scanline" />
            </div>
            
            {/* Product Info */}
            <div className="modal-info">
              {/* Badge */}
              <div className="modal-badge" style={{ borderLeftColor: getCategoryColor() }}>
                {product.tag}
              </div>
              
              {/* Title with glitch effect */}
              <h2 className={`modal-title ${glitchText ? 'glitch-active' : ''}`} 
                  data-text={product.name}>
                {product.name}
              </h2>
              
              {/* Category Tag */}
              <div className="modal-category" style={{ color: getCategoryColor() }}>
                {product.cat.toUpperCase()}
              </div>
              
              {/* Description */}
              <p className="modal-description">
                Carte prépayée officielle pour {product.name}. 
                Livraison instantanée par email après validation du paiement. 
                Code utilisable immédiatement sur votre compte.
              </p>

              
              {/* Amount Selector */}
              <div className="modal-amounts">
                <label className="amount-label">Choisissez le montant</label>
                <div className="amount-buttons">
                  {amounts.map((amount) => (
                    <button
                      key={amount}
                      className={`amount-btn ${selectedAmount === amount ? 'active' : ''}`}
                      onClick={() => setSelectedAmount(amount)}
                      style={selectedAmount === amount ? {
                        background: getCategoryGradient(),
                        borderColor: getCategoryColor()
                      } : {}}
                    >
                      {amount}€
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Quantity Selector */}
              <div className="modal-quantity">
                <label className="quantity-label">Quantité</label>
                <div className="quantity-selector">
                  <button 
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Price Display */}
              <div className="modal-price-section">
                <div className="modal-price-row">
                  <span className="modal-price-label">Prix unitaire</span>
                  <div className="modal-prices">
                    <span className="modal-price-eur">{selectedAmount}€</span>
                    <span className="modal-price-fcfa">
                      {toFCFA(selectedAmount)} FCFA
                    </span>
                  </div>
                </div>
                {quantity > 1 && (
                  <div className="modal-price-row total-row">
                    <span className="modal-price-label">Total ({quantity}x)</span>
                    <div className="modal-prices">
                      <span className="modal-price-eur total">{totalPrice}€</span>
                      <span className="modal-price-fcfa">
                        {toFCFA(totalPrice)} FCFA
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="modal-actions">
                <button 
                  className={`modal-add-btn ${added ? 'added' : ''} ${isLoading ? 'loading' : ''}`}
                  onClick={handleAdd}
                  disabled={isLoading}
                  style={added ? { background: getCategoryGradient() } : {}}
                >
                  {isLoading ? (
                    <span className="btn-content">
                      <span className="spinner-small"></span>
                      Ajout en cours...
                    </span>
                  ) : added ? (
                    <span className="btn-content">
                      <span className="btn-icon">✓</span> Ajouté !
                    </span>
                  ) : (
                    <span className="btn-content">
                      <span className="btn-icon">+</span>
                      Ajouter au panier
                      <span className="btn-price">{totalPrice}€</span>
                    </span>
                  )}
                </button>
                <button className="modal-cancel-btn" onClick={onClose}>
                  Continuer mes achats
                </button>
              </div>
            </div>
          </div>
          
          {/* Glitch Scanlines */}
          <div className="modal-scanlines" />
        </div>
      </div>
      
      <style>{`
        /* ── MODAL OVERLAY ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        
        /* ── MODAL CONTAINER ── */
        .modal-container {
          position: relative;
          max-width: 900px;
          width: 90%;
          max-height: 85vh;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border: 1px solid var(--border-cyan);
          transition: all 0.3s ease;
        }
        
        .modal-container.success-mode {
          transform: scale(1.02);
          box-shadow: 0 0 50px var(--green-glow);
        }
        
        /* ── SUCCESS OVERLAY ── */
        .success-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
 backdrop-filter: blur(20px);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        
        .blur-content {
          filter: blur(4px);
          transition: filter 0.3s ease;
        }
        
        .success-animation {
          position: relative;
          margin-bottom: 20px;
        }
        
.success-checkmark {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--green), var(--green));
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          box-shadow: 0 0 40px var(--green-glow);
        }
        
        .check-icon {
          font-size: 48px;
          color: white;
          font-weight: bold;
          animation: checkBounce 0.5s ease;
        }
        
        .success-sparkles {
          position: absolute;
          inset: -20px;
          pointer-events: none;
        }
        
        .sparkle {
          position: absolute;
          font-size: 24px;
          animation: sparkleFloat 1s ease-out forwards;
        }
        
        .sparkle:nth-child(1) {
          top: -20px;
          left: 50%;
          animation-delay: 0.1s;
        }
        
        .sparkle:nth-child(2) {
          bottom: -20px;
          right: -20px;
          animation-delay: 0.2s;
        }
        
        .sparkle:nth-child(3) {
          top: 50%;
          left: -30px;
          animation-delay: 0.3s;
        }
        
        .success-message {
          text-align: center;
          animation: slideUp 0.5s ease;
        }
        
        .success-message h3 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 10px;
          background: linear-gradient(135deg, var(--green), var(--cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .success-message p {
          color: var(--text-muted);
          margin: 5px 0;
        }
        
        .success-total {
          font-size: 18px;
          font-weight: 700;
          color: var(--cyan);
          margin-top: 10px;
        }
        
        /* ── GLITCH BORDERS ── */
        .modal-glitch-border {
          position: absolute;
          inset: -2px;
          border-radius: calc(var(--radius-xl) + 2px);
          background: linear-gradient(135deg, 
            var(--cyan), var(--violet), var(--pink), var(--cyan));
          background-size: 300% 300%;
          opacity: 0;
          z-index: -1;
          transition: opacity 0.3s ease;
        }
        
        .modal-container:hover .modal-glitch-border {
          opacity: 0.8;
          animation: glowRotate 3s linear infinite;
        }
        
        .modal-glitch-border.glitch-delay-1 {
          filter: blur(8px);
          opacity: 0;
        }
        
        .modal-container:hover .modal-glitch-border.glitch-delay-1 {
          opacity: 0.5;
          animation: glowRotate 3s linear infinite 0.1s;
        }
        
        .modal-glitch-border.glitch-delay-2 {
          filter: blur(16px);
          opacity: 0;
        }
        
        .modal-container:hover .modal-glitch-border.glitch-delay-2 {
          opacity: 0.3;
          animation: glowRotate 3s linear infinite 0.2s;
        }
        
        /* ── CLOSE BUTTON ── */
        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid var(--border);
          color: var(--text-muted);
          cursor: pointer;
          z-index: 15;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-close:hover {
          background: rgba(255, 0, 80, 0.2);
          border-color: var(--pink);
          color: var(--pink);
          transform: rotate(90deg);
        }
        
        /* ── MODAL CONTENT ── */
        .modal-content {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
          padding: 32px;
          transition: filter 0.3s ease;
        }
        
        /* ── MODAL MEDIA ── */
        .modal-media {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg2), var(--bg3));
          position: relative;
        }
        
        html.dark .modal-media {
          box-shadow: 0 0 40px rgba(0, 240, 255, 0.2);
        }
        
        html.light .modal-media {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .modal-media-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--cyan-dim), transparent 70%);
          opacity: 0.5;
          animation: pulse 2s ease-in-out infinite;
        }
        
        .modal-product-icon {
          font-size: 6rem;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
          animation: iconFloat 3s ease-in-out infinite;
        }
        
        .modal-scanline {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          );
          pointer-events: none;
          animation: scanlineMove 8s linear infinite;
        }
        
        /* ── MODAL INFO ── */
        .modal-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .modal-badge {
          display: inline-block;
          width: fit-content;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border-left: 3px solid;
        }
        
        html.dark .modal-badge {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--border);
          border-left: 3px solid;
        }
        
        html.light .modal-badge {
          background: white;
          border: 1px solid var(--border);
          border-left: 3px solid;
        }
        
        /* ── GLITCH TITLE ── */
        .modal-title {
          font-size: 1.8rem;
          font-weight: 800;
          font-family: var(--font-display);
          margin: 0;
          position: relative;
          transition: all 0.1s ease;
        }
        
        html.dark .modal-title {
          color: var(--text);
        }
        
        html.light .modal-title {
          color: var(--text);
        }
        
        .modal-title.glitch-active {
          animation: glitchText 0.15s linear 3;
          color: var(--cyan);
        }
        
        .modal-title.glitch-active::before,
        .modal-title.glitch-active::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .modal-title.glitch-active::before {
          left: 2px;
          text-shadow: -2px 0 var(--pink);
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
          animation: glitchShift 0.1s linear infinite;
        }
        
        .modal-title.glitch-active::after {
          left: -2px;
          text-shadow: 2px 0 var(--cyan);
          clip-path: polygon(0 80%, 100% 20%, 100% 100%, 0 100%);
          animation: glitchShift 0.1s linear infinite reverse;
        }
        
        .modal-category {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .modal-description {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-muted);
        }
        
        /* ── FEATURES ── */
        .modal-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 8px 0;
        }
        
        .modal-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
        }
        
        html.dark .modal-feature {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
        }
        
        html.light .modal-feature {
          background: var(--bg2);
          border: 1px solid var(--border);
        }
        
        .feature-icon {
          font-size: 16px;
        }
        
        /* ── AMOUNT SELECTOR ── */
        .modal-amounts {
          margin: 8px 0;
        }
        
        .amount-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 12px;
          display: block;
        }
        
        .amount-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .amount-btn {
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        html.dark .amount-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        
        html.light .amount-btn {
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        
        .amount-btn.active {
          color: white;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .amount-btn:hover:not(.active) {
          transform: translateY(-2px);
          border-color: var(--border-cyan);
        }
        
        /* ── QUANTITY SELECTOR ── */
        .modal-quantity {
          margin: 8px 0;
        }
        
        .quantity-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 12px;
          display: block;
        }
        
        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .quantity-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        html.dark .quantity-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text);
        }
        
        html.light .quantity-btn {
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text);
        }
        
        .quantity-btn:hover:not(:disabled) {
          background: var(--cyan-dim);
          border-color: var(--cyan);
          color: var(--cyan);
          transform: scale(1.05);
        }
        
        .quantity-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .quantity-value {
          font-size: 18px;
          font-weight: 700;
          min-width: 40px;
          text-align: center;
        }
        
        /* ── PRICE SECTION ── */
        .modal-price-section {
          padding: 16px;
          border-radius: var(--radius-md);
          margin: 8px 0;
        }
        
        html.dark .modal-price-section {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(191, 75, 255, 0.05));
          border: 1px solid var(--border-cyan);
        }
        
        html.light .modal-price-section {
          background: linear-gradient(135deg, rgba(8, 145, 178, 0.05), rgba(124, 58, 237, 0.05));
          border: 1px solid var(--border-cyan);
        }
        
        .modal-price-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        
        .modal-price-row:last-child {
          margin-bottom: 0;
        }
        
        .total-row {
          padding-top: 8px;
          border-top: 1px dashed var(--border);
        }
        
        .modal-price-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
        }
        
        .modal-prices {
          text-align: right;
        }
        
        .modal-price-eur {
          font-size: 1.8rem;
          font-weight: 800;
          display: block;
          line-height: 1;
        }
        
        .modal-price-eur.total {
          font-size: 2rem;
          background: linear-gradient(135deg, var(--cyan), var(--green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        html.dark .modal-price-eur {
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        html.light .modal-price-eur {
          background: linear-gradient(135deg, #0891b2, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .modal-price-fcfa {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        /* ── ACTION BUTTONS ── */
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        
        .modal-add-btn {
          flex: 2;
          padding: 14px 24px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
html.dark .modal-add-btn {
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          border: none;
          color: #000;
        }
        
        html.light .modal-add-btn {
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          border: none;
          color: white;
        }
        
        .modal-add-btn.added {
          animation: btnPulse 0.5s ease;
        }
        
        .modal-add-btn.loading {
          opacity: 0.7;
          cursor: wait;
        }
        
        .modal-add-btn:hover:not(:disabled) {
          transform: scale(1.02);
          filter: brightness(1.05);
        }
        
        .modal-add-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .btn-price {
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.2);
          font-size: 12px;
        }
        
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        
        .modal-cancel-btn {
          flex: 1;
          padding: 14px 24px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        html.dark .modal-cancel-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        
        html.light .modal-cancel-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        
        .modal-cancel-btn:hover {
          border-color: var(--border-cyan);
          color: var(--cyan);
          transform: translateY(-2px);
        }
        
        /* ── SCANLINES OVERLAY ── */
        .modal-scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          );
          opacity: 0.5;
        }
        
        /* ── ANIMATIONS ── */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes checkBounce {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes sparkleFloat {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes btnPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes glitchText {
          0%, 100% { transform: skew(0deg); }
          33% { transform: skew(2deg); }
          66% { transform: skew(-2deg); }
        }
        
        @keyframes glitchShift {
          0% { transform: translate(0); }
          100% { transform: translate(2px, -1px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glowRotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .modal-content {
            grid-template-columns: 1fr;
            padding: 24px;
            gap: 20px;
          }
          
          .modal-media {
            max-width: 280px;
            margin: 0 auto;
          }
          
          .modal-product-icon {
            font-size: 4rem;
          }
          
          .modal-title {
            font-size: 1.4rem;
          }
          
          .modal-features {
            grid-template-columns: 1fr;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .modal-container {
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .modal-price-eur {
            font-size: 1.4rem;
          }
          
          .modal-price-eur.total {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </>
  );
}
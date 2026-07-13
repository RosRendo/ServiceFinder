import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, ThumbsUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";

interface ReviewFormProps {
  serviceName: string;
  companyName: string;
  onSubmit?: (review: { rating: number; comment: string }) => void;
}

export default function ReviewForm({ serviceName, companyName, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const ratingLabels = [
    "",
    "Poor",
    "Fair",
    "Good",
    "Very Good",
    "Excellent",
  ];

  const quickFeedback = [
    "Great service!",
    "Very professional",
    "On time arrival",
    "Excellent quality",
    "Friendly staff",
    "Would recommend",
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Tap on the stars to rate your experience.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: "Review Submitted!",
      description: "Thank you for your feedback.",
    });

    onSubmit?.({ rating, comment });
  };

  const handleQuickFeedback = (feedback: string) => {
    setComment((prev) => {
      if (prev.includes(feedback)) return prev;
      return prev ? `${prev} ${feedback}` : feedback;
    });
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-6 shadow-soft text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
        >
          <ThumbsUp className="w-8 h-8 text-green-500" />
        </motion.div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Thanks for Your Review!
        </h3>
        <p className="text-muted-foreground">
          Your feedback helps {companyName} improve their services and helps others make better decisions.
        </p>
        <div className="flex items-center justify-center gap-1 mt-4">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 shadow-soft"
    >
      <h2 className="font-display text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Rate Your Experience
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        How was your {serviceName} service with {companyName}?
      </p>

      {/* Star Rating */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.button
              key={i}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-transform"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  i < (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </motion.button>
          ))}
        </div>
        <motion.span
          key={hoverRating || rating}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-foreground h-5"
        >
          {ratingLabels[hoverRating || rating]}
        </motion.span>
      </div>

      {/* Quick Feedback Tags */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Quick feedback:</p>
        <div className="flex flex-wrap gap-2">
          {quickFeedback.map((feedback) => (
            <button
              key={feedback}
              type="button"
              onClick={() => handleQuickFeedback(feedback)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                comment.includes(feedback)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {feedback}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Textarea */}
      <div className="mb-6">
        <Textarea
          placeholder="Share more details about your experience (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {comment.length}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        className="w-full gap-2"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Review
          </>
        )}
      </Button>
    </motion.div>
  );
}

import { useToastStore } from '../../store/toastStore';
import { AppError } from './AppError';
import { ErrorTracker } from './ErrorTracker';

export const ErrorHandler = {
  async handle(error, { context = '', toast = true, throwAfter = false } = {}) {
    const appError = error instanceof AppError ? error : new AppError(
      error.message || 'An unexpected error occurred',
      'unknown',
      { recoverable: false, cause: error }
    );

    await ErrorTracker.log(appError, { context });

    if (toast) {
      const message = appError.recoveryHint
        ? `${appError.message}. ${appError.recoveryHint}`
        : appError.message;
      useToastStore.getState().addToast(message, 'error', 5000);
    }

    console.error(`[${context}] ${appError.category}:`, appError.message, appError.cause || '');

    if (throwAfter) throw appError;
    return appError;
  },
};

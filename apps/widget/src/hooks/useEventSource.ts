import { useState } from 'react';
import { API_URL } from '@config';
import { IErrorObject, IReviewData } from '@impler/shared';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const defaultPage = 1;

export const useEventSourceQuery = (uploadId: string) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(defaultPage);
  const [totalPages, setTotalPages] = useState<number>(defaultPage);

  const fetchData = (): Promise<IReviewData> => {
    return new Promise((resolve, reject) => {
      const evtSource = new EventSource(`${API_URL}/v1/review/${uploadId}?page=${page}`);

      evtSource.addEventListener(
        'message',
        (event) => {
          const eventData = event.data && JSON.parse(event.data);
          if (eventData) {
            if (eventData.limit && eventData.page && eventData.totalPages) {
              queryClient.setQueryData<IReviewData>([`review-stream`, page], (oldData) => {
                return {
                  ...(oldData || {}),
                  limit: eventData.limit,
                  page: eventData.page,
                  totalPages: eventData.totalPages,
                  totalRecords: eventData.totalRecords,
                } as IReviewData;
              });
              setPage(eventData.page);
              setTotalPages(eventData.totalPages);
              evtSource.close();
            } else {
              queryClient.setQueryData<IReviewData>([`review-stream`, page], (oldData) => {
                return {
                  ...(oldData || {}),
                  data: [...(oldData?.data || []), eventData],
                  limit: eventData.limit,
                  page: eventData.page,
                  totalPages: eventData.totalPages,
                  totalRecords: eventData.totalRecords,
                } as IReviewData;
              });
              resolve({
                ...((queryClient.getQueryData<IReviewData>([`review-stream`, page]) || {}) as IReviewData),
              });
            }
          }
        },
        false
      );

      evtSource.onerror = (event) => {
        reject(event);
        evtSource.close();
      };
    });
  };

  const { data, isLoading, isFetching } = useQuery<IReviewData, IErrorObject, IReviewData, [string, number]>(
    [`review-stream`, page],
    fetchData
  );

  return {
    data,
    page,
    setPage,
    isLoading,
    isFetching,
    totalPages,
  };
};

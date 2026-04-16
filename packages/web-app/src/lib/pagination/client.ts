/**
 * page query を更新する
 */
export function setPageParam(params: URLSearchParams, page: number) {
  if (page <= 1) {
    params.delete("page");
    return;
  }

  params.set("page", String(page));
}

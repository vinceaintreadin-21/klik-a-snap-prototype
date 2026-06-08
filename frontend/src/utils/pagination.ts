export interface PageSizeConfig {
    default: number 
    options: number[]
}

export const getPageSizeConfig = (totalRows: number): PageSizeConfig => {
  if (totalRows <= 50)  return { default: 25,  options: [25, 50]           };
  if (totalRows <= 200) return { default: 50,  options: [25, 50, 100]      };
  if (totalRows <= 500) return { default: 100, options: [50, 100, 200]     };
  return                       { default: 200, options: [100, 200, 500]    };
};
